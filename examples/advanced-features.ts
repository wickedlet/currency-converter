/**
 * Advanced features demonstration with new providers
 */
import {
  CurrencyConverter,
  OpenExchangeRatesProvider,
  CurrencyLayerProvider,
  ExchangeRateHostProvider
} from '@wickedlet/currency-converter';

async function historicalRatesExample() {
  console.log('=== Historical Rates Example ===\n');

  // Using Exchangerate.host (free with historical data)
  const provider = new ExchangeRateHostProvider();
  const converter = new CurrencyConverter({ provider });

  try {
    console.log('Fetching historical rates for 2024-01-01...');
    const response = await provider.getHistoricalRates('2024-01-01', 'USD');
    
    if (response.success) {
      console.log('✅ Historical rates found');
      console.log('Date:', response.date);
      console.log('Base currency:', response.base);
      console.log('Sample rates:');
      
      const sampleCurrencies = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      for (const currency of sampleCurrencies) {
        if (response.rates[currency]) {
          console.log(`  ${response.base}/${currency}: ${response.rates[currency]}`);
        }
      }
    } else {
      console.log('❌ Failed to fetch historical rates:', response.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function timeSeriesExample() {
  console.log('\n=== Time Series Example ===\n');

  const provider = new ExchangeRateHostProvider();

  try {
    console.log('Fetching time series data for USD (2024-01-01 to 2024-01-07)...');
    
    const timeSeries = await provider.getTimeSeries(
      '2024-01-01',
      '2024-01-07',
      'USD',
      ['EUR', 'GBP', 'JPY']
    );

    if (timeSeries.success) {
      console.log('✅ Time series data found');
      console.log('Period:', timeSeries.start_date, 'to', timeSeries.end_date);
      console.log('Base currency:', timeSeries.base);
      
      console.log('\nDaily rates:');
      for (const [date, rates] of Object.entries(timeSeries.rates || {})) {
        console.log(`${date}:`);
        const ratesObj = rates as { [key: string]: number };
        for (const [currency, rate] of Object.entries(ratesObj)) {
          if (['EUR', 'GBP', 'JPY'].includes(currency)) {
            console.log(`  ${currency}: ${rate}`);
          }
        }
      }
    } else {
      console.log('❌ Failed to fetch time series');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function fluctuationAnalysisExample() {
  console.log('\n=== Fluctuation Analysis Example ===\n');

  const provider = new ExchangeRateHostProvider();

  try {
    console.log('Analyzing currency fluctuations (2024-01-01 to 2024-01-31)...');
    
    const fluctuation = await provider.getFluctuation(
      '2024-01-01',
      '2024-01-31',
      'USD',
      ['EUR', 'GBP', 'JPY', 'CAD']
    );

    if (fluctuation.success) {
      console.log('✅ Fluctuation data found');
      console.log('Analysis period:', fluctuation.start_date, 'to', fluctuation.end_date);
      
      console.log('\nCurrency fluctuations:');
      for (const [currency, data] of Object.entries(fluctuation.rates || {})) {
        const fluctData = data as any;
        const change = fluctData.change || 0;
        const changePercent = fluctData.change_pct || 0;
        
        const direction = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        console.log(`${direction} ${currency}: ${change.toFixed(6)} (${changePercent.toFixed(2)}%)`);
        console.log(`   Start: ${fluctData.start_rate} | End: ${fluctData.end_rate}`);
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function multiProviderRedundancyExample() {
  console.log('\n=== Multi-Provider Redundancy Example ===\n');

  // Setup multiple providers for redundancy
  const providers = [
    {
      name: 'Exchangerate.host',
      provider: new ExchangeRateHostProvider(),
    },
    {
      name: 'ExchangeRate-API',
      provider: new ExchangeRateApiProvider({ plan: 'free' }),
    },
  ];

  // Add paid providers if API keys are available
  if (process.env.OPEN_EXCHANGE_RATES_API_KEY) {
    providers.push({
      name: 'Open Exchange Rates',
      provider: new OpenExchangeRatesProvider({
        apiKey: process.env.OPEN_EXCHANGE_RATES_API_KEY,
        plan: 'free',
      }),
    });
  }

  if (process.env.CURRENCYLAYER_API_KEY) {
    providers.push({
      name: 'CurrencyLayer',
      provider: new CurrencyLayerProvider({
        apiKey: process.env.CURRENCYLAYER_API_KEY,
      }),
    });
  }

  console.log(`Testing redundancy with ${providers.length} providers...\n`);

  // Function to try conversion with fallback
  async function convertWithFallback(amount: number, from: string, to: string) {
    for (let i = 0; i < providers.length; i++) {
      const { name, provider } = providers[i];
      
      try {
        console.log(`Attempting with ${name}...`);
        const converter = new CurrencyConverter({ provider });
        const result = await converter.convertCurrency(amount, from, to);
        
        console.log(`✅ Success with ${name}: ${result.convertedAmount} ${to}`);
        console.log(`   Rate: ${result.rate}, Cached: ${result.cached}\n`);
        
        return result;
      } catch (error) {
        console.log(`❌ ${name} failed: ${error.message}`);
        
        if (i === providers.length - 1) {
          console.log('❌ All providers failed!');
          throw new Error('All currency providers failed');
        } else {
          console.log('🔄 Trying next provider...\n');
        }
      }
    }
  }

  try {
    await convertWithFallback(100, 'USD', 'EUR');
  } catch (error) {
    console.log('Final error:', error.message);
  }
}

async function currencyValidationExample() {
  console.log('\n=== Currency Validation Example ===\n');

  const provider = new ExchangeRateHostProvider();

  try {
    console.log('Getting supported currencies...');
    const currencies = await provider.getSupportedCurrencies();
    
    console.log(`✅ Found ${currencies.length} supported currencies`);
    console.log('Major currencies:', currencies.filter(c => 
      ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'].includes(c)
    ));

    // Test currency validation
    console.log('\n--- Currency Validation Tests ---');
    
    const testCurrencies = ['USD', 'EUR', 'XYZ', 'INVALID', 'BTC'];
    
    for (const currency of testCurrencies) {
      const isValid = currencies.includes(currency);
      const status = isValid ? '✅' : '❌';
      console.log(`${status} ${currency}: ${isValid ? 'Valid' : 'Invalid'}`);
    }

    // Get currency information
    console.log('\n--- Currency Information ---');
    const currencyInfo = await provider.getCurrencyInfo();
    
    if (currencyInfo.success) {
      const sampleCurrencies = ['USD', 'EUR', 'GBP', 'JPY'];
      for (const code of sampleCurrencies) {
        const info = currencyInfo.symbols[code];
        if (info) {
          console.log(`${code}: ${info}`);
        }
      }
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function performanceBenchmarkExample() {
  console.log('\n=== Performance Benchmark Example ===\n');

  const providers = [
    { name: 'Exchangerate.host', provider: new ExchangeRateHostProvider() },
  ];

  // Add other providers if available
  if (process.env.OPEN_EXCHANGE_RATES_API_KEY) {
    providers.push({
      name: 'Open Exchange Rates',
      provider: new OpenExchangeRatesProvider({
        apiKey: process.env.OPEN_EXCHANGE_RATES_API_KEY,
      }),
    });
  }

  const conversions = [
    { amount: 100, from: 'USD', to: 'EUR' },
    { amount: 200, from: 'EUR', to: 'GBP' },
    { amount: 300, from: 'GBP', to: 'JPY' },
    { amount: 400, from: 'JPY', to: 'CAD' },
    { amount: 500, from: 'CAD', to: 'AUD' },
  ];

  console.log(`Benchmarking ${providers.length} providers with ${conversions.length} conversions each...\n`);

  for (const { name, provider } of providers) {
    console.log(`--- Testing ${name} ---`);
    
    const converter = new CurrencyConverter({ provider });
    const results = [];
    
    const startTime = Date.now();
    
    for (const conversion of conversions) {
      try {
        const conversionStart = Date.now();
        const result = await converter.convertCurrency(
          conversion.amount,
          conversion.from,
          conversion.to
        );
        const conversionTime = Date.now() - conversionStart;
        
        results.push({
          success: true,
          time: conversionTime,
          result,
        });
        
        console.log(`  ✅ ${conversion.from} → ${conversion.to}: ${conversionTime}ms`);
      } catch (error) {
        results.push({
          success: false,
          time: 0,
          error: error.message,
        });
        
        console.log(`  ❌ ${conversion.from} → ${conversion.to}: ${error.message}`);
      }
    }
    
    const totalTime = Date.now() - startTime;
    const successfulResults = results.filter(r => r.success);
    const avgTime = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length 
      : 0;
    
    console.log(`\n  📊 ${name} Summary:`);
    console.log(`     Total time: ${totalTime}ms`);
    console.log(`     Average per conversion: ${avgTime.toFixed(2)}ms`);
    console.log(`     Success rate: ${successfulResults.length}/${conversions.length}`);
    console.log('');
  }
}

async function vatRatesExample() {
  console.log('\n=== VAT Rates Example (EU Countries) ===\n');

  const provider = new ExchangeRateHostProvider();

  try {
    console.log('Fetching VAT rates for EU countries...');
    const vatRates = await provider.getVatRates();
    
    if (vatRates.success) {
      console.log('✅ VAT rates found\n');
      
      // Show some major EU countries
      const majorCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE'];
      
      console.log('Major EU Countries VAT Rates:');
      for (const country of majorCountries) {
        const rate = vatRates.rates[country];
        if (rate) {
          console.log(`  ${country}: ${rate.standard_rate}% (standard)`);
          if (rate.reduced_rates && rate.reduced_rates.length > 0) {
            console.log(`       Reduced: ${rate.reduced_rates.join(', ')}%`);
          }
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run all examples
if (require.main === module) {
  (async () => {
    try {
      await historicalRatesExample();
      await timeSeriesExample();
      await fluctuationAnalysisExample();
      await multiProviderRedundancyExample();
      await currencyValidationExample();
      await performanceBenchmarkExample();
      await vatRatesExample();
    } catch (error) {
      console.error('Example failed:', error);
    }
  })();
}

export {
  historicalRatesExample,
  timeSeriesExample,
  fluctuationAnalysisExample,
  multiProviderRedundancyExample,
  currencyValidationExample,
  performanceBenchmarkExample,
  vatRatesExample,
};
