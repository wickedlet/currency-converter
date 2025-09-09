# Sử dụng @wickedlet/currency-converter trong AdonisJS

Đây là hướng dẫn tích hợp package `@wickedlet/currency-converter` vào dự án AdonisJS hiện tại.

## Cài đặt

```bash
npm install @wickedlet/currency-converter
```

## Cấu hình trong AdonisJS

### 1. Cập nhật config/api.ts

```typescript
// config/api.ts
export const currencyConfig = {
  fixer: {
    url: env.get('FIXER_URL', 'http://data.fixer.io'),
    apiKey: env.get('FIXER_API_KEY'),
  },
  exchangeRateApi: {
    apiKey: env.get('EXCHANGE_RATE_API_KEY'), // Optional for free tier
  }
}
```

### 2. Thay thế logic trong CommonHelper

```typescript
// app/helpers/common_helper.ts
import { CurrencyConverter, FixerProvider } from '@wickedlet/currency-converter';
import redis from '@adonisjs/redis/services/main';
import { currencyConfig } from '#config/api';

export class CommonHelper {
  private static converter: CurrencyConverter;

  private static getConverter(): CurrencyConverter {
    if (!this.converter) {
      // Initialize Fixer provider
      const provider = new FixerProvider({
        apiKey: currencyConfig.fixer.apiKey,
        baseUrl: currencyConfig.fixer.url,
        timeout: 10000,
        retries: 3,
      });

      // Create converter with Redis caching
      this.converter = new CurrencyConverter({
        provider,
        cache: {
          client: redis,
          config: {
            ttl: 86400, // 24 hours
            keyPrefix: 'currency_rate',
          },
        },
      });
    }

    return this.converter;
  }

  /**
   * Convert amount from one currency to another using the new package
   * @param amount The amount to convert
   * @param from Source currency code (e.g., 'USD')
   * @param to Target currency code (e.g., 'EUR')
   * @returns Converted amount rounded to 2 decimal places
   */
  public static async convertCurrency(amount: number, from: string, to: string): Promise<number> {
    try {
      const converter = this.getConverter();
      const result = await converter.convertCurrency(amount, from, to);
      return result.convertedAmount;
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return amount; // Return original amount on error
    }
  }

  /**
   * Get exchange rates for a base currency
   */
  public static async getExchangeRates(baseCurrency: string = 'USD') {
    try {
      const converter = this.getConverter();
      return await converter.getExchangeRates(baseCurrency);
    } catch (error) {
      console.error('Failed to get exchange rates:', error);
      return {};
    }
  }

  /**
   * Convert multiple amounts at once
   */
  public static async convertMultiple(conversions: Array<{amount: number, from: string, to: string}>) {
    try {
      const converter = this.getConverter();
      return await converter.convertMultiple(conversions);
    } catch (error) {
      console.error('Multiple conversion failed:', error);
      return [];
    }
  }

  /**
   * Clear cached exchange rates
   */
  public static async clearCurrencyCache(baseCurrency?: string) {
    try {
      const converter = this.getConverter();
      await converter.clearCache(baseCurrency);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
```

### 3. Tạo Service riêng cho Currency (Khuyến nghị)

```typescript
// app/services/currency_service.ts
import { 
  CurrencyConverter, 
  FixerProvider, 
  ExchangeRateApiProvider,
  ConversionResult 
} from '@wickedlet/currency-converter';
import redis from '@adonisjs/redis/services/main';
import { currencyConfig } from '#config/api';

export default class CurrencyService {
  private converter: CurrencyConverter;

  constructor() {
    this.initializeConverter();
  }

  private initializeConverter() {
    // You can switch providers based on configuration
    const provider = new FixerProvider({
      apiKey: currencyConfig.fixer.apiKey,
      timeout: 10000,
      retries: 3,
    });

    this.converter = new CurrencyConverter({
      provider,
      cache: {
        client: redis,
        config: {
          ttl: 86400, // 24 hours
          keyPrefix: 'currency_rate',
        },
      },
    });
  }

  /**
   * Convert single currency
   */
  async convert(amount: number, from: string, to: string): Promise<ConversionResult> {
    return await this.converter.convertCurrency(amount, from, to);
  }

  /**
   * Convert multiple currencies
   */
  async convertMultiple(conversions: Array<{amount: number, from: string, to: string}>): Promise<ConversionResult[]> {
    return await this.converter.convertMultiple(conversions);
  }

  /**
   * Get all exchange rates for a base currency
   */
  async getRates(baseCurrency: string = 'USD') {
    return await this.converter.getExchangeRates(baseCurrency);
  }

  /**
   * Get specific exchange rate
   */
  async getRate(from: string, to: string): Promise<number> {
    return await this.converter.getExchangeRate(from, to);
  }

  /**
   * Switch to different provider
   */
  switchToExchangeRateApi() {
    const provider = new ExchangeRateApiProvider({
      plan: 'free', // or 'pro' with apiKey
    });

    this.converter.setProvider(provider);
  }

  /**
   * Clear cache
   */
  async clearCache(baseCurrency?: string) {
    await this.converter.clearCache(baseCurrency);
  }

  /**
   * Check if rates are cached
   */
  async isCached(baseCurrency: string): Promise<boolean> {
    return await this.converter.isCached(baseCurrency);
  }
}
```

### 4. Sử dụng trong Controller

```typescript
// app/controllers/product_assistant_controller.ts
import CurrencyService from '#services/currency_service';

export default class ProductAssistantController {
  private currencyService = new CurrencyService();

  async convertProductPrice() {
    try {
      const result = await this.currencyService.convert(100, 'USD', 'EUR');
      
      return {
        success: true,
        originalAmount: result.amount,
        convertedAmount: result.convertedAmount,
        from: result.from,
        to: result.to,
        rate: result.rate,
        cached: result.cached,
        timestamp: result.timestamp,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getExchangeRates() {
    try {
      const rates = await this.currencyService.getRates('USD');
      return {
        success: true,
        rates,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
```

### 5. Tạo Command để test

```typescript
// commands/test_currency.ts
import { BaseCommand } from '@adonisjs/core/build/standalone';
import CurrencyService from 'App/Services/CurrencyService';

export default class TestCurrency extends BaseCommand {
  public static commandName = 'test:currency';
  public static description = 'Test currency conversion';

  public async run() {
    const currencyService = new CurrencyService();

    this.logger.info('Testing currency conversion...');

    try {
      // Test single conversion
      const result = await currencyService.convert(100, 'USD', 'EUR');
      this.logger.info('Single conversion:', result);

      // Test multiple conversions
      const multipleResults = await currencyService.convertMultiple([
        { amount: 100, from: 'USD', to: 'EUR' },
        { amount: 50, from: 'GBP', to: 'JPY' },
        { amount: 200, from: 'CAD', to: 'AUD' },
      ]);
      this.logger.info('Multiple conversions:', multipleResults);

      // Test exchange rates
      const rates = await currencyService.getRates('USD');
      this.logger.info('Exchange rates for USD:', Object.keys(rates).length, 'currencies');

      // Test caching
      const isCached = await currencyService.isCached('USD');
      this.logger.info('USD rates cached:', isCached);

    } catch (error) {
      this.logger.error('Test failed:', error.message);
    }
  }
}
```

## Chạy test

```bash
node ace test:currency
```

## Ưu điểm của việc sử dụng package

1. **Tách biệt logic**: Currency conversion logic được tách ra khỏi business logic
2. **Hỗ trợ nhiều provider**: Dễ dàng chuyển đổi giữa các provider khác nhau
3. **Caching tự động**: Redis caching được tích hợp sẵn
4. **Type safety**: Full TypeScript support
5. **Error handling**: Robust error handling và retry logic
6. **Testable**: Dễ dàng mock và test
7. **Extensible**: Có thể extend với custom providers

## Migration từ code cũ

Thay vì sử dụng code cũ trong `CommonHelper.convertCurrency()`, giờ bạn có thể:

```typescript
// Cũ
const convertedAmount = await CommonHelper.convertCurrency(100, 'USD', 'EUR');

// Mới với package
const currencyService = new CurrencyService();
const result = await currencyService.convert(100, 'USD', 'EUR');
const convertedAmount = result.convertedAmount;
```

Package cung cấp nhiều thông tin hơn như rate, timestamp, cached status và error handling tốt hơn.
