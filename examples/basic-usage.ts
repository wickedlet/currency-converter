/**
 * Basic usage example without caching
 */
import { CurrencyConverter, FixerProvider } from '@wickedlet/currency-converter';

async function basicExample() {
  try {
    // Initialize Fixer provider
    const provider = new FixerProvider({
      apiKey: process.env.FIXER_API_KEY || 'your-fixer-api-key',
    });

    // Create converter without caching
    const converter = new CurrencyConverter({
      provider,
    });

    console.log('=== Basic Currency Conversion ===');
    
    // Convert USD to EUR
    const result1 = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log('100 USD to EUR:', result1);

    // Convert GBP to JPY
    const result2 = await converter.convertCurrency(50, 'GBP', 'JPY');
    console.log('50 GBP to JPY:', result2);

    // Same currency conversion
    const result3 = await converter.convertCurrency(100, 'USD', 'USD');
    console.log('100 USD to USD:', result3);

    console.log('\n=== Get Exchange Rates ===');
    
    // Get all rates for USD
    const rates = await converter.getExchangeRates('USD');
    console.log('USD exchange rates:', Object.keys(rates).slice(0, 5), '... and more');

    // Get specific rate
    const usdToEur = await converter.getExchangeRate('USD', 'EUR');
    console.log('USD to EUR rate:', usdToEur);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  basicExample();
}
