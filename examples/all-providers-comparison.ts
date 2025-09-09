/**
 * Comprehensive example comparing all available providers
 */
import { 
  CurrencyConverter,
  FixerProvider,
  ExchangeRateApiProvider,
  OpenExchangeRatesProvider,
  CurrencyLayerProvider,
  ExchangeRateHostProvider
} from '@wickedlet/currency-converter';

async function compareAllProviders() {
  console.log('=== Currency Converter Providers Comparison ===\n');

  const providers = [];

  // 1. Exchangerate.host (Free, no API key required)
  try {
    console.log('1. Setting up Exchangerate.host (Free) ✅');
    const exchangeRateHostProvider = new ExchangeRateHostProvider();
    providers.push({
      name: 'Exchangerate.host',
      provider: exchangeRateHostProvider,
      cost: 'Free',
      apiKeyRequired: false,
    });
  } catch (error) {
    console.log('❌ Exchangerate.host setup failed:', error.message);
  }

  // 2. ExchangeRate-API (Free tier)
  try {
    console.log('2. Setting up ExchangeRate-API (Free) ✅');
    const exchangeRateApiProvider = new ExchangeRateApiProvider({
      plan: 'free',
    });
    providers.push({
      name: 'ExchangeRate-API (Free)',
      provider: exchangeRateApiProvider,
      cost: 'Free',
      apiKeyRequired: false,
    });
  } catch (error) {
    console.log('❌ ExchangeRate-API setup failed:', error.message);
  }

  // 3. Open Exchange Rates (requires API key)
  if (process.env.OPEN_EXCHANGE_RATES_API_KEY) {
    try {
      console.log('3. Setting up Open Exchange Rates ✅');
      const openExchangeProvider = new OpenExchangeRatesProvider({
        apiKey: process.env.OPEN_EXCHANGE_RATES_API_KEY,
        plan: 'free',
      });
      providers.push({
        name: 'Open Exchange Rates',
        provider: openExchangeProvider,
        cost: 'Free tier available',
        apiKeyRequired: true,
      });
    } catch (error) {
      console.log('❌ Open Exchange Rates setup failed:', error.message);
    }
  } else {
    console.log('⚠️  Open Exchange Rates skipped (no API key)');
  }

  // 4. CurrencyLayer (requires API key)
  if (process.env.CURRENCYLAYER_API_KEY) {
    try {
      console.log('4. Setting up CurrencyLayer ✅');
      const currencyLayerProvider = new CurrencyLayerProvider({
        apiKey: process.env.CURRENCYLAYER_API_KEY,
        useHttps: false, // Free plan uses HTTP
      });
      providers.push({
        name: 'CurrencyLayer',
        provider: currencyLayerProvider,
        cost: 'Free tier available',
        apiKeyRequired: true,
      });
    } catch (error) {
      console.log('❌ CurrencyLayer setup failed:', error.message);
    }
  } else {
    console.log('⚠️  CurrencyLayer skipped (no API key)');
  }

  // 5. Fixer.io (requires API key)
  if (process.env.FIXER_API_KEY) {
    try {
      console.log('5. Setting up Fixer.io ✅');
      const fixerProvider = new FixerProvider({
        apiKey: process.env.FIXER_API_KEY,
        useHttps: false, // Free plan uses HTTP
      });
      providers.push({
        name: 'Fixer.io',
        provider: fixerProvider,
        cost: 'Free tier available',
        apiKeyRequired: true,
      });
    } catch (error) {
      console.log('❌ Fixer.io setup failed:', error.message);
    }
  } else {
    console.log('⚠️  Fixer.io skipped (no API key)');
  }

  console.log(`\n✅ Successfully set up ${providers.length} providers\n`);

  // Test conversion with each provider
  const testAmount = 100;
  const fromCurrency = 'USD';
  const toCurrency = 'EUR';

  console.log(`=== Testing ${testAmount} ${fromCurrency} to ${toCurrency} conversion ===\n`);

  const results = [];

  for (const providerInfo of providers) {
    try {
      console.log(`Testing ${providerInfo.name}...`);
      
      const converter = new CurrencyConverter({
        provider: providerInfo.provider,
      });

      const start = Date.now();
      const result = await converter.convertCurrency(testAmount, fromCurrency, toCurrency);
      const time = Date.now() - start;

      results.push({
        ...providerInfo,
        result,
        responseTime: time,
        success: true,
      });

      console.log(`✅ ${providerInfo.name}: ${result.convertedAmount} ${toCurrency} (${time}ms)`);
    } catch (error) {
      console.log(`❌ ${providerInfo.name} failed: ${error.message}`);
      
      results.push({
        ...providerInfo,
        error: error.message,
        success: false,
      });
    }
  }

  // Summary
  console.log('\n=== Results Summary ===\n');
  
  const successfulResults = results.filter(r => r.success);
  const avgRate = successfulResults.length > 0 
    ? successfulResults.reduce((sum, r) => sum + r.result.rate, 0) / successfulResults.length 
    : 0;

  console.log('Provider Performance:');
  results.forEach((result, index) => {
    if (result.success) {
      const deviation = Math.abs(result.result.rate - avgRate);
      const deviationPercent = avgRate > 0 ? (deviation / avgRate * 100).toFixed(2) : '0';
      
      console.log(`${index + 1}. ${result.name.padEnd(25)} | Rate: ${result.result.rate.toFixed(6)} | Time: ${result.responseTime}ms | Deviation: ${deviationPercent}%`);
    } else {
      console.log(`${index + 1}. ${result.name.padEnd(25)} | ❌ Failed: ${result.error}`);
    }
  });

  console.log(`\nAverage Exchange Rate: ${avgRate.toFixed(6)}`);
  console.log(`Successful Providers: ${successfulResults.length}/${results.length}`);

  // Test provider-specific features
  console.log('\n=== Testing Provider-Specific Features ===\n');

  for (const providerInfo of providers) {
    if (!providerInfo.success) continue;

    console.log(`\n--- ${providerInfo.name} Features ---`);
    
    try {
      // Test supported currencies
      if (typeof providerInfo.provider.getSupportedCurrencies === 'function') {
        const currencies = await providerInfo.provider.getSupportedCurrencies();
        console.log(`✅ Supported currencies: ${currencies.length} currencies`);
        console.log(`   Sample: ${currencies.slice(0, 10).join(', ')}`);
      }

      // Test historical rates (where supported)
      if (typeof providerInfo.provider.getHistoricalRates === 'function') {
        try {
          const historicalRates = await providerInfo.provider.getHistoricalRates('2024-01-01', 'USD');
          if (historicalRates.success) {
            console.log(`✅ Historical rates: Available (${Object.keys(historicalRates.rates || {}).length} currencies)`);
          } else {
            console.log(`⚠️  Historical rates: ${historicalRates.error || 'Not available'}`);
          }
        } catch (error) {
          console.log(`⚠️  Historical rates: ${error.message}`);
        }
      }

      // Test conversion (where supported)
      if (typeof providerInfo.provider.convertAmount === 'function') {
        try {
          const conversion = await providerInfo.provider.convertAmount(100, 'USD', 'EUR');
          console.log(`✅ Direct conversion: ${conversion.result} EUR`);
        } catch (error) {
          console.log(`⚠️  Direct conversion: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Feature test failed: ${error.message}`);
    }
  }

  // Recommendations
  console.log('\n=== Recommendations ===\n');
  
  console.log('🆓 **Free Options (No API Key Required):**');
  console.log('   1. Exchangerate.host - Completely free, good features');
  console.log('   2. ExchangeRate-API (Free tier) - Good for basic usage');
  
  console.log('\n💰 **Paid Options (Better features, higher limits):**');
  console.log('   1. Open Exchange Rates - Good free tier, excellent paid plans');
  console.log('   2. CurrencyLayer - Reliable, good documentation');
  console.log('   3. Fixer.io - Well-established, good support');
  
  console.log('\n🎯 **Use Case Recommendations:**');
  console.log('   • Development/Testing: Exchangerate.host (free)');
  console.log('   • Low volume production: ExchangeRate-API free tier');
  console.log('   • High volume production: Open Exchange Rates or CurrencyLayer');
  console.log('   • Enterprise: Fixer.io or Open Exchange Rates Enterprise');
  
  console.log('\n✨ **Pro Tips:**');
  console.log('   • Always implement fallback providers');
  console.log('   • Use Redis caching to reduce API calls');
  console.log('   • Monitor your API usage and set up alerts');
  console.log('   • Consider using multiple providers for redundancy');
}

// Provider switching example
async function providerSwitchingExample() {
  console.log('\n=== Provider Switching Example ===\n');

  // Start with free provider
  let currentProvider = new ExchangeRateHostProvider();
  let converter = new CurrencyConverter({ provider: currentProvider });

  console.log('1. Starting with Exchangerate.host (free)');
  
  try {
    const result1 = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log(`   Result: ${result1.convertedAmount} EUR`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Switch to ExchangeRate-API
  console.log('\n2. Switching to ExchangeRate-API');
  const newProvider = new ExchangeRateApiProvider({ plan: 'free' });
  converter.setProvider(newProvider);

  try {
    const result2 = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log(`   Result: ${result2.convertedAmount} EUR`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n3. Provider switching allows you to:');
  console.log('   • Handle API failures gracefully');
  console.log('   • Compare rates from different sources');
  console.log('   • Switch between free and paid tiers');
  console.log('   • Implement load balancing');
}

// Run examples
if (require.main === module) {
  compareAllProviders()
    .then(() => providerSwitchingExample())
    .catch(console.error);
}

export { compareAllProviders, providerSwitchingExample };
