# @wickedlet/currency-converter

A flexible currency converter package for Node.js with TypeScript support, multiple exchange rate providers, and Redis caching.

## Features

- 🔄 **Multiple Providers**: Support for Fixer.io, Open Exchange Rates, CurrencyLayer, and easy extension for custom providers
- ⚡ **Intelligent Redis Caching**: Advanced bulk exchange rates caching (99%+ performance improvement)
- 🎯 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🛡️ **Error Handling**: Robust error handling and retry logic
- 📊 **Multiple Conversions**: Batch conversion support
- 🔍 **Historical Rates**: Support for historical exchange rates (provider dependent)
- 💰 **Cost Optimization**: Massive API call reduction (~99% fewer calls)
- 📈 **Cache Management**: Rich cache statistics and manual refresh capabilities

## Installation

```bash
npm install @wickedlet/currency-converter
```

You'll also need Redis for caching:

```bash
npm install redis
```

## Quick Start

### Basic Usage without Caching

```typescript
import { CurrencyConverter, FixerProvider } from '@wickedlet/currency-converter';

// Initialize provider
const provider = new FixerProvider({
  apiKey: 'your-fixer-api-key',
});

// Create converter without caching
const converter = new CurrencyConverter({
  provider,
});

// Convert currency
const result = await converter.convertCurrency(100, 'USD', 'EUR');
console.log(result);
// Output: {
//   amount: 100,
//   from: 'USD',
//   to: 'EUR',
//   convertedAmount: 85.23,
//   rate: 0.8523,
//   timestamp: '2024-01-15T10:30:00.000Z',
//   cached: false
// }
```

### With Intelligent Redis Caching

```typescript
import { createClient } from 'redis';
import { CurrencyConverter, FixerProvider } from '@wickedlet/currency-converter';

// Setup Redis client
const redisClient = createClient({
  host: 'localhost',
  port: 6379,
});
await redisClient.connect();

// Initialize provider
const provider = new FixerProvider({
  apiKey: 'your-fixer-api-key',
});

// Create converter with intelligent caching
const converter = new CurrencyConverter({
  provider,
  cache: {
    client: redisClient,
    config: {
      ttl: 3600, // 1 hour
      keyPrefix: 'my_app_currency',
    },
  },
});

// First conversion - fetches and caches ALL exchange rates
const result1 = await converter.convertCurrency(100, 'USD', 'EUR');
console.log(`Cached: ${result1.cached}`); // false - fresh API call
// ✅ This call caches 172+ exchange rates for USD base

// Subsequent conversions with same base - instant from cache  
const result2 = await converter.convertCurrency(50, 'USD', 'GBP');
console.log(`Cached: ${result2.cached}`); // true - instant from cache

const result3 = await converter.convertCurrency(200, 'USD', 'JPY');
console.log(`Cached: ${result3.cached}`); // true - instant from cache

// Performance: First call ~600ms, subsequent calls 0-1ms (99%+ improvement!)
```

## Providers

### Fixer.io Provider

```typescript
import { FixerProvider } from '@wickedlet/currency-converter';

const provider = new FixerProvider({
  apiKey: 'your-fixer-api-key',
  useHttps: true, // Use HTTPS endpoint (paid plan)
  timeout: 5000,
  retries: 3,
});
```


### Open Exchange Rates Provider

```typescript
import { OpenExchangeRatesProvider } from '@wickedlet/currency-converter';

const openExchangeProvider = new OpenExchangeRatesProvider({
  apiKey: 'your-openexchangerates-api-key',
  plan: 'free', // 'free', 'developer', 'enterprise'
});
```

### CurrencyLayer Provider

```typescript
import { CurrencyLayerProvider } from '@wickedlet/currency-converter';

const currencyLayerProvider = new CurrencyLayerProvider({
  apiKey: 'your-currencylayer-api-key',
  useHttps: true, // Requires paid plan
});
```


## Advanced Usage

### Multiple Conversions

```typescript
const conversions = [
  { amount: 100, from: 'USD', to: 'EUR' },
  { amount: 50, from: 'GBP', to: 'JPY' },
  { amount: 200, from: 'CAD', to: 'AUD' },
];

const results = await converter.convertMultiple(conversions);
console.log(results);
```

### Get Exchange Rates

```typescript
// Get all rates for USD base
const rates = await converter.getExchangeRates('USD');
console.log(rates);
// Output: { EUR: 0.8523, GBP: 0.7856, JPY: 110.23, ... }

// Get specific exchange rate
const usdToEur = await converter.getExchangeRate('USD', 'EUR');
console.log(usdToEur); // 0.8523
```

### Advanced Cache Management

```typescript
// =================== NEW CACHING FEATURES ===================

// Get comprehensive cache statistics
const stats = await converter.getCacheStats();
console.log(stats);
// Output: {
//   totalKeys: 3,
//   providers: ['Fixer.io', 'OpenExchangeRates'], 
//   currencies: ['USD', 'EUR', 'GBP'],
//   oldestTimestamp: 1609459200000,
//   newestTimestamp: 1609462800000
// }

// Check if provider rates are cached for specific base currency
const isProviderCached = await converter.isProviderRatesCached('USD');
console.log(`USD rates cached for current provider: ${isProviderCached}`);

// Get cache TTL for current provider
const providerTTL = await converter.getProviderRatesCacheTTL('USD');
console.log(`Provider cache expires in ${providerTTL} seconds`);

// Force refresh rates for current provider (clears cache + fresh API call)
const freshRates = await converter.refreshProviderRates('USD');
console.log(`Refreshed ${Object.keys(freshRates).length} rates`);

// Clear all cached rates for current provider
await converter.clearProviderCache();

// Clear ALL exchange rates cache (all providers, all currencies)
await converter.clearAllRatesCache();

// =================== LEGACY CACHE METHODS ===================
// These still work for backward compatibility but use the old caching system

// Check if conversion results are cached (legacy)
const isCached = await converter.isCached('USD');
console.log(isCached);

// Get cache TTL for conversion results (legacy)
const ttl = await converter.getCacheTTL('USD');
console.log(`Legacy cache expires in ${ttl} seconds`);

// Clear legacy cache for specific currency
await converter.clearCache('USD');

// Clear all legacy cache
await converter.clearCache();
```

### Historical Rates (Provider Dependent)

```typescript
// Fixer.io historical rates
const fixerProvider = new FixerProvider({
  apiKey: 'your-api-key',
});

const historicalRates = await fixerProvider.getHistoricalRates('2024-01-01', 'USD');
console.log(historicalRates);
```

### Custom Provider

Create your own provider by extending the base provider:

```typescript
import { BaseCurrencyProvider, ExchangeRateResponse } from '@wickedlet/currency-converter';

export class CustomProvider extends BaseCurrencyProvider {
  public readonly name = 'Custom API';
  protected readonly baseUrl = 'https://api.custom.com';
  protected readonly defaultTimeout = 5000;

  public isConfigValid(): boolean {
    return !!(this.config as any).apiKey;
  }

  public async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      const response = await this.makeRequest({
        method: 'GET',
        url: `/rates/${baseCurrency}`,
        params: {
          api_key: (this.config as any).apiKey,
        },
      });

      return this.formatResponse(true, baseCurrency, response.rates);
    } catch (error: any) {
      return this.formatResponse(false, baseCurrency, null, error.message);
    }
  }
}
```

## Intelligent Caching Strategy

### How It Works

The package uses an intelligent **bulk exchange rates caching** strategy that dramatically improves performance and reduces API costs:

#### Traditional Approach (❌ Inefficient):
```
Conversion: 100 USD → EUR  →  API Call → Cache result
Conversion: 100 USD → GBP  →  API Call → Cache result  
Conversion: 100 USD → JPY  →  API Call → Cache result
Result: 3 API calls for 3 conversions
```

#### Our Intelligent Approach (✅ Efficient):
```
Conversion: 100 USD → EUR  →  API Call → Cache ALL 172 rates for USD base
Conversion: 100 USD → GBP  →  Instant from cache (0ms)
Conversion: 100 USD → JPY  →  Instant from cache (0ms)
Result: 1 API call for 172+ conversions
```

### Cache Architecture

```
Redis Key Structure:
├── exchange_rates:Fixer.io:USD     → { EUR: 0.85, GBP: 0.74, JPY: 147.3, ... }
├── exchange_rates:Fixer.io:EUR     → { USD: 1.18, GBP: 0.87, JPY: 173.2, ... }
├── exchange_rates:OpenExchangeRates:USD → { EUR: 0.851, GBP: 0.741, ... }
└── legacy cache keys (for backward compatibility)
```

### Performance Benefits

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| First USD conversion | 600ms | 600ms | Same (populates cache) |
| 2nd USD conversion | 600ms | 0-1ms | 99%+ faster |
| 100 USD conversions | 60,000ms | 600ms | 99%+ faster |
| API calls for 100 conversions | 100 calls | 1 call | 99% reduction |

### Cost Optimization

- **Fixer.io Free (100 calls/month)**: Supports 100 × 172 = 17,200 conversions
- **Open Exchange Rates Free (1,000 calls/month)**: Supports 1,000 × 172 = 172,000 conversions
- **Massive savings** on paid plans with high-volume usage

## Configuration Options

### Provider Configuration

```typescript
interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number; // Request timeout in milliseconds
  retries?: number; // Number of retry attempts
}
```

### Cache Configuration

```typescript
interface CacheConfig {
  ttl?: number; // Time to live in seconds (default: 86400 = 24 hours)
  keyPrefix?: string; // Redis key prefix (default: 'currency_rate')
}
```

### Converter Configuration

```typescript
interface CurrencyConverterConfig {
  provider: ICurrencyProvider;
  cache?: {
    client: RedisClient; // Redis client instance
    config?: CacheConfig;
  };
}
```

## Error Handling

The package provides comprehensive error handling:

```typescript
try {
  const result = await converter.convertCurrency(100, 'USD', 'INVALID');
} catch (error) {
  console.error('Conversion failed:', error.message);
  // Handle error appropriately
}
```

Common error scenarios:
- Invalid currency codes
- Network timeouts
- API rate limits
- Invalid API keys
- Redis connection issues (gracefully handled - conversion continues without caching)

## API Reference

### CurrencyConverter

#### Core Conversion Methods

- `convertCurrency(amount: number, from: string, to: string): Promise<ConversionResult>`
- `convertCurrencyDetailed(amount: number, from: string, to: string): Promise<DetailedConversionResult>`
- `getExchangeRates(baseCurrency?: string): Promise<ExchangeRates>`
- `getExchangeRate(from: string, to: string): Promise<number>`
- `convertMultiple(conversions: ConversionRequest[]): Promise<ConversionResult[]>`

#### Provider Management

- `setProvider(provider: ICurrencyProvider): void`
- `getProviderName(): string`

#### Advanced Cache Management (NEW in v1.3.0)

- `getCacheStats(): Promise<CacheStatistics>` - Get comprehensive cache statistics
- `isProviderRatesCached(baseCurrency: string): Promise<boolean>` - Check if provider rates are cached
- `getProviderRatesCacheTTL(baseCurrency: string): Promise<number>` - Get provider cache TTL
- `refreshProviderRates(baseCurrency: string): Promise<ExchangeRates>` - Force refresh provider rates
- `clearProviderCache(): Promise<void>` - Clear all cached rates for current provider
- `clearAllRatesCache(): Promise<void>` - Clear ALL exchange rates cache

#### Legacy Cache Methods (Backward Compatibility)

- `clearCache(baseCurrency?: string): Promise<void>` - Clear legacy cache
- `isCached(baseCurrency: string): Promise<boolean>` - Check legacy cache
- `getCacheTTL(baseCurrency: string): Promise<number>` - Get legacy cache TTL

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please use the [GitHub Issues](https://github.com/wickedlet/currency-converter/issues) page.
