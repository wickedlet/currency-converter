/**
 * Example using multiple providers
 */
import { 
  CurrencyConverter, 
  FixerProvider, 
  ExchangeRateApiProvider 
} from '@wickedlet/currency-converter';

async function multipleProvidersExample() {
  try {
    console.log('=== Fixer.io Provider ===');
    
    // Fixer provider
    const fixerProvider = new FixerProvider({
      apiKey: process.env.FIXER_API_KEY || 'your-fixer-api-key',
    });

    const fixerConverter = new CurrencyConverter({
      provider: fixerProvider,
    });

    console.log('Provider:', fixerConverter.getProviderName());
    const fixerResult = await fixerConverter.convertCurrency(100, 'USD', 'EUR');
    console.log('Fixer result:', fixerResult);

    console.log('\n=== ExchangeRate-API Provider (Free) ===');
    
    // ExchangeRate-API provider (free)
    const exchangeRateProvider = new ExchangeRateApiProvider({
      plan: 'free',
    });

    const exchangeRateConverter = new CurrencyConverter({
      provider: exchangeRateProvider,
    });

    console.log('Provider:', exchangeRateConverter.getProviderName());
    const exchangeRateResult = await exchangeRateConverter.convertCurrency(100, 'USD', 'EUR');
    console.log('ExchangeRate-API result:', exchangeRateResult);

    console.log('\n=== ExchangeRate-API Provider (Pro) ===');
    
    // ExchangeRate-API provider (pro)
    const exchangeRateProProvider = new ExchangeRateApiProvider({
      plan: 'pro',
      apiKey: process.env.EXCHANGERATE_API_KEY || 'your-exchangerate-api-key',
    });

    const exchangeRateProConverter = new CurrencyConverter({
      provider: exchangeRateProProvider,
    });

    console.log('Provider:', exchangeRateProConverter.getProviderName());
    const exchangeRateProResult = await exchangeRateProConverter.convertCurrency(100, 'USD', 'EUR');
    console.log('ExchangeRate-API Pro result:', exchangeRateProResult);

    console.log('\n=== Switching Providers ===');
    
    // Start with one provider and switch to another
    const converter = new CurrencyConverter({
      provider: fixerProvider,
    });

    console.log('Initial provider:', converter.getProviderName());
    const result1 = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log('Result 1:', result1);

    // Switch provider
    converter.setProvider(exchangeRateProvider);
    console.log('New provider:', converter.getProviderName());
    const result2 = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log('Result 2:', result2);

    console.log('\n=== Provider-Specific Features ===');
    
    // Get supported currencies (Fixer)
    try {
      const fixerCurrencies = await fixerProvider.getSupportedCurrencies();
      console.log(`Fixer supported currencies: ${fixerCurrencies.length} currencies`);
      console.log('Sample currencies:', fixerCurrencies.slice(0, 10));
    } catch (error) {
      console.log('Fixer currencies error:', error.message);
    }

    // Get supported currencies (ExchangeRate-API)
    try {
      const exchangeRateCurrencies = await exchangeRateProvider.getSupportedCurrencies();
      console.log(`ExchangeRate-API supported currencies: ${exchangeRateCurrencies.length} currencies`);
      console.log('Sample currencies:', exchangeRateCurrencies.slice(0, 10));
    } catch (error) {
      console.log('ExchangeRate-API currencies error:', error.message);
    }

    // Historical rates (Fixer)
    try {
      const historicalRates = await fixerProvider.getHistoricalRates('2024-01-01', 'USD');
      console.log('Fixer historical rates for 2024-01-01:', {
        success: historicalRates.success,
        base: historicalRates.base,
        date: historicalRates.date,
        ratesCount: Object.keys(historicalRates.rates || {}).length,
      });
    } catch (error) {
      console.log('Fixer historical rates error:', error.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  multipleProvidersExample();
}
