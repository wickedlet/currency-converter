/**
 * Example of creating a custom currency provider
 */
import { 
  BaseCurrencyProvider, 
  ExchangeRateResponse, 
  ProviderConfig,
  CurrencyConverter 
} from '@wickedlet/currency-converter';

// Mock API provider for demonstration
interface MockApiConfig extends ProviderConfig {
  apiKey: string;
  region?: string;
}

class MockCurrencyProvider extends BaseCurrencyProvider {
  public readonly name = 'Mock Currency API';
  protected readonly baseUrl = 'https://api.mock-currency.com';
  protected readonly defaultTimeout = 5000;

  constructor(config: MockApiConfig) {
    super(config);
    
    if (!this.isConfigValid()) {
      throw new Error('Mock API key is required');
    }
  }

  public isConfigValid(): boolean {
    return !!(this.config as MockApiConfig).apiKey;
  }

  public async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      
      // Since this is a mock provider, we'll simulate API response
      // In a real implementation, you would make an actual HTTP request
      const mockRates = this.generateMockRates(normalizedBase);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return this.formatResponse(true, normalizedBase, mockRates);
    } catch (error: any) {
      return this.formatResponse(
        false,
        this.normalizeCurrencyCode(baseCurrency),
        null,
        `Mock API error: ${error.message}`
      );
    }
  }

  private generateMockRates(baseCurrency: string): { [key: string]: number } {
    // Generate mock exchange rates
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NOK'];
    const rates: { [key: string]: number } = {};
    
    // Base currency always has rate 1
    rates[baseCurrency] = 1;
    
    // Generate random but realistic rates for other currencies
    for (const currency of currencies) {
      if (currency !== baseCurrency) {
        // Generate rates based on typical currency relationships
        let rate: number;
        
        switch (currency) {
          case 'JPY':
            rate = baseCurrency === 'USD' ? 110 + Math.random() * 20 : (110 + Math.random() * 20) / this.getBaseRate(baseCurrency);
            break;
          case 'EUR':
            rate = baseCurrency === 'USD' ? 0.85 + Math.random() * 0.1 : (0.85 + Math.random() * 0.1) / this.getBaseRate(baseCurrency);
            break;
          case 'GBP':
            rate = baseCurrency === 'USD' ? 0.75 + Math.random() * 0.1 : (0.75 + Math.random() * 0.1) / this.getBaseRate(baseCurrency);
            break;
          default:
            rate = baseCurrency === 'USD' ? 0.5 + Math.random() * 2 : (0.5 + Math.random() * 2) / this.getBaseRate(baseCurrency);
        }
        
        rates[currency] = Number(rate.toFixed(6));
      }
    }
    
    return rates;
  }

  private getBaseRate(currency: string): number {
    // Mock base rates relative to USD
    const baseRates: { [key: string]: number } = {
      'USD': 1,
      'EUR': 0.85,
      'GBP': 0.75,
      'JPY': 110,
      'CAD': 1.25,
      'AUD': 1.35,
    };
    
    return baseRates[currency] || 1;
  }

  // Custom method specific to this provider
  public async getRegionalRates(region: string): Promise<any> {
    const config = this.config as MockApiConfig;
    
    console.log(`Getting regional rates for ${region} with API key: ${config.apiKey.substring(0, 8)}...`);
    
    // Mock regional rates
    const regionalRates = {
      'ASIA': ['JPY', 'CNY', 'KRW', 'SGD'],
      'EUROPE': ['EUR', 'GBP', 'CHF', 'SEK'],
      'AMERICAS': ['USD', 'CAD', 'BRL', 'MXN'],
    };
    
    return {
      region,
      currencies: (regionalRates as any)[region.toUpperCase()] || [],
      rates: this.generateMockRates('USD'),
    };
  }
}

async function customProviderExample() {
  try {
    console.log('=== Custom Provider Example ===');
    
    // Create custom provider
    const customProvider = new MockCurrencyProvider({
      apiKey: 'mock-api-key-12345',
      region: 'GLOBAL',
      timeout: 10000,
      retries: 2,
    });

    // Test provider validation
    console.log('Provider name:', customProvider.name);
    console.log('Config valid:', customProvider.isConfigValid());

    // Create converter with custom provider
    const converter = new CurrencyConverter({
      provider: customProvider,
    });

    console.log('\n=== Basic Conversions ===');
    
    // Test basic conversions
    const result1 = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log('100 USD to EUR:', result1);

    const result2 = await converter.convertCurrency(50, 'EUR', 'JPY');
    console.log('50 EUR to JPY:', result2);

    console.log('\n=== Exchange Rates ===');
    
    // Get all rates
    const rates = await converter.getExchangeRates('USD');
    console.log('USD exchange rates:', rates);

    console.log('\n=== Provider-Specific Features ===');
    
    // Use custom provider methods
    const asiaRates = await customProvider.getRegionalRates('ASIA');
    console.log('Asia regional rates:', asiaRates);

    const europeRates = await customProvider.getRegionalRates('EUROPE');
    console.log('Europe regional rates:', europeRates);

    console.log('\n=== Error Handling ===');
    
    // Test error handling
    try {
      await converter.convertCurrency(100, 'INVALID', 'EUR');
    } catch (error) {
      console.log('Expected error for invalid currency:', error.message);
    }

    console.log('\n=== Performance Test ===');
    
    // Performance test with multiple conversions
    const conversions = [
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 200, from: 'EUR', to: 'GBP' },
      { amount: 300, from: 'GBP', to: 'JPY' },
      { amount: 400, from: 'JPY', to: 'CAD' },
      { amount: 500, from: 'CAD', to: 'AUD' },
    ];

    const start = Date.now();
    const results = await converter.convertMultiple(conversions);
    const time = Date.now() - start;

    console.log(`Completed ${results.length} conversions in ${time}ms`);
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.amount} ${result.from} = ${result.convertedAmount} ${result.to}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example of extending the custom provider further
class AdvancedMockProvider extends MockCurrencyProvider {
  public readonly name = 'Advanced Mock Currency API';

  // Add historical rates functionality
  public async getHistoricalRates(date: string, baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      console.log(`Getting historical rates for ${date} with base ${baseCurrency}`);
      
      // Simulate historical rate differences
      const currentRates = this.generateMockRates(baseCurrency);
      const historicalRates: { [key: string]: number } = {};
      
      // Add some variation for historical rates
      for (const [currency, rate] of Object.entries(currentRates)) {
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        historicalRates[currency] = Number((rate * (1 + variation)).toFixed(6));
      }
      
      return {
        success: true,
        base: baseCurrency,
        date,
        rates: historicalRates,
      };
    } catch (error: any) {
      return this.formatResponse(false, baseCurrency, null, error.message);
    }
  }

  // Add real-time rate updates
  public async subscribeToRealTimeRates(callback: (rates: any) => void): Promise<void> {
    console.log('Starting real-time rate subscription...');
    
    // Simulate real-time updates every 5 seconds
    const interval = setInterval(() => {
      const rates = this.generateMockRates('USD');
      callback({
        timestamp: new Date().toISOString(),
        rates,
      });
    }, 5000);

    // Stop after 30 seconds for demo
    setTimeout(() => {
      clearInterval(interval);
      console.log('Real-time subscription stopped');
    }, 30000);
  }
}

async function advancedProviderExample() {
  try {
    console.log('\n=== Advanced Custom Provider Example ===');
    
    const advancedProvider = new AdvancedMockProvider({
      apiKey: 'advanced-mock-api-key',
    });

    // Test historical rates
    const historicalRates = await advancedProvider.getHistoricalRates('2024-01-01', 'USD');
    console.log('Historical rates for 2024-01-01:', historicalRates);

    // Test real-time subscription
    console.log('\nStarting real-time rate subscription for 10 seconds...');
    await advancedProvider.subscribeToRealTimeRates((data) => {
      console.log('Real-time update:', data.timestamp, 'USD/EUR:', data.rates.EUR);
    });

  } catch (error) {
    console.error('Advanced provider error:', error.message);
  }
}

// Run the examples
if (require.main === module) {
  customProviderExample()
    .then(() => advancedProviderExample())
    .catch(console.error);
}
