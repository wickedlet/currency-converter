const { CurrencyConverter } = require('./dist/currency-converter');
const { CurrencyLayerProvider, FixerProvider, OpenExchangeRatesProvider } = require('./dist/providers');

// =============================================================================
// MANUAL TESTING SCRIPT
// =============================================================================
// Change API keys and configuration here to test

async function testCurrencyLayerProvider() {
  console.log('\n🔄 Testing CurrencyLayer Provider...');
  console.log('='.repeat(50));
  
  try {
    // Change API key here
    const provider = new CurrencyLayerProvider({
      apiKey: 'YOUR_CURRENCYLAYER_API_KEY_HERE',
      // baseUrl: 'https://custom-api.example.com/api', // Option: custom base URL
      // useHttps: true, // Option: use HTTPS (requires paid plan)
      // defaultParams: { format: 1, precision: 6 }, // Option: default params
      // timeout: 10000, // Option: timeout
      // retries: 3 // Option: number of retries
    });

    console.log('✅ Provider initialized:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test getting exchange rates
    const rates = await provider.getExchangeRates('USD');
    console.log('✅ Exchange rates for USD:');
    console.log('  - EUR:', rates.rates.EUR);
    console.log('  - GBP:', rates.rates.GBP);
    console.log('  - JPY:', rates.rates.JPY);
    console.log('  - Date:', rates.date);

    // Test currency converter
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log('✅ Conversion result (100 USD to EUR):');
    console.log('  - Amount:', result.convertedAmount);
    console.log('  - Rate:', result.rate);
    
    // Test other methods
    if (provider.getSupportedCurrencies) {
      const currencies = await provider.getSupportedCurrencies();
      console.log('✅ Supported currencies count:', currencies.length);
      console.log('  - First 10:', currencies.slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ CurrencyLayer Error:', error.message);
  }
}

async function testFixerProvider() {
  console.log('\n🔄 Testing Fixer Provider...');
  console.log('='.repeat(50));
  
  try {
    // Change API key here
    const provider = new FixerProvider({
      apiKey: 'YOUR_FIXER_API_KEY_HERE',
      // baseUrl: 'https://custom-fixer.example.com/api', // Option: custom base URL
      // useHttps: true, // Option: use HTTPS (requires paid plan)
      // defaultParams: { precision: 6 }, // Option: default params
      // timeout: 10000, // Option: timeout
    });

    console.log('✅ Provider initialized:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test getting exchange rates
    const rates = await provider.getExchangeRates('EUR');
    console.log('✅ Exchange rates for EUR:');
    console.log('  - USD:', rates.rates.USD);
    console.log('  - GBP:', rates.rates.GBP);
    console.log('  - JPY:', rates.rates.JPY);
    console.log('  - Date:', rates.date);

    // Test currency converter
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'EUR', 'USD');
    console.log('✅ Conversion result (100 EUR to USD):');
    console.log('  - Amount:', result.convertedAmount);
    console.log('  - Rate:', result.rate);

    // Test supported currencies
    if (provider.getSupportedCurrencies) {
      const currencies = await provider.getSupportedCurrencies();
      console.log('✅ Supported currencies count:', currencies.length);
      console.log('  - First 10:', currencies.slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ Fixer Error:', error.message);
  }
}

async function testOpenExchangeRatesProvider() {
  console.log('\n🔄 Testing Open Exchange Rates Provider...');
  console.log('='.repeat(50));
  
  try {
    // Change API key here
    const provider = new OpenExchangeRatesProvider({
      apiKey: 'YOUR_OPEN_EXCHANGE_RATES_API_KEY_HERE',
      // baseUrl: 'https://custom-oxr.example.com/v6', // Option: custom base URL
      // plan: 'free', // or 'developer', 'enterprise'
      // defaultParams: { show_alternative: true, prettyprint: 1 }, // Option: default params
      // timeout: 10000, // Option: timeout
    });

    console.log('✅ Provider initialized:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test getting exchange rates
    const rates = await provider.getExchangeRates('USD');
    console.log('✅ Exchange rates for USD:');
    console.log('  - EUR:', rates.rates.EUR);
    console.log('  - GBP:', rates.rates.GBP);
    console.log('  - JPY:', rates.rates.JPY);
    console.log('  - Date:', rates.date);

    // Test currency converter
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'USD', 'GBP');
    console.log('✅ Conversion result (100 USD to GBP):');
    console.log('  - Amount:', result.convertedAmount);
    console.log('  - Rate:', result.rate);

    // Test supported currencies
    if (provider.getSupportedCurrencies) {
      const currencies = await provider.getSupportedCurrencies();
      console.log('✅ Supported currencies count:', currencies.length);
      console.log('  - First 10:', currencies.slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ Open Exchange Rates Error:', error.message);
  }
}

async function testCustomConfiguration() {
  console.log('\n🔄 Testing Custom Configuration...');
  console.log('='.repeat(50));
  
  try {
    // Test custom baseUrl và defaultParams
    const provider = new CurrencyLayerProvider({
      apiKey: 'YOUR_CURRENCYLAYER_API_KEY_HERE',
      baseUrl: 'https://apilayer.net/api', // Custom base URL
      defaultParams: {
        format: 1,
        precision: 6,
        source: 'USD'
      },
      timeout: 15000,
      retries: 5
    });

    console.log('✅ Custom config provider initialized');
    console.log('✅ Provider name:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test với custom config
    const rates = await provider.getExchangeRates('USD');
    console.log('✅ Custom config working - got rates for', Object.keys(rates.rates).length, 'currencies');

  } catch (error) {
    console.error('❌ Custom Config Error:', error.message);
  }
}

// =============================================================================
// PROVIDER TESTS WITH COMMAND LINE OPTIONS
// =============================================================================

async function testCurrencyLayerProviderWithOptions(options = {}) {
  console.log('\n🔄 Testing CurrencyLayer Provider with custom options...');
  console.log('='.repeat(50));
  
  try {
    const config = {
      apiKey: options.key || '8d10428b9eb8d6bddba2a209b036e98a',
    };
    
    // Add optional parameters if provided
    if (options.baseUrl) config.baseUrl = options.baseUrl;
    if (options.useHttps !== undefined) config.useHttps = options.useHttps;
    if (options.timeout) config.timeout = options.timeout;
    if (options.retries) config.retries = options.retries;
    
    // Build defaultParams from command line options
    const defaultParams = {};
    if (options.format) defaultParams.format = options.format;
    if (options.precision) defaultParams.precision = options.precision;
    if (Object.keys(defaultParams).length > 0) {
      config.defaultParams = defaultParams;
    }

    console.log('🔧 Configuration:', JSON.stringify(config, null, 2));

    const provider = new CurrencyLayerProvider(config);

    console.log('✅ Provider initialized:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test getting exchange rates
    const rates = await provider.getExchangeRates('USD');
    console.log('✅ Exchange rates for USD:');
    console.log('  - EUR:', rates.rates.EUR);
    console.log('  - GBP:', rates.rates.GBP);
    console.log('  - JPY:', rates.rates.JPY);
    console.log('  - Date:', rates.date);

    // Test currency converter
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'USD', 'EUR');
    console.log('✅ Conversion result (100 USD to EUR):');
    console.log('  - Amount:', result.convertedAmount);
    console.log('  - Rate:', result.rate);
    
    // Test other methods
    if (provider.getSupportedCurrencies) {
      const currencies = await provider.getSupportedCurrencies();
      console.log('✅ Supported currencies count:', currencies.length);
      console.log('  - First 10:', currencies.slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ CurrencyLayer Error:', error.message);
  }
}

async function testFixerProviderWithOptions(options = {}) {
  console.log('\n🔄 Testing Fixer Provider with custom options...');
  console.log('='.repeat(50));
  
  try {
    const config = {
      apiKey: options.key || 'YOUR_FIXER_API_KEY_HERE',
    };
    
    // Add optional parameters if provided
    if (options.baseUrl) config.baseUrl = options.baseUrl;
    if (options.useHttps !== undefined) config.useHttps = options.useHttps;
    if (options.timeout) config.timeout = options.timeout;
    if (options.retries) config.retries = options.retries;
    
    // Build defaultParams from command line options
    const defaultParams = {};
    if (options.precision) defaultParams.precision = options.precision;
    if (Object.keys(defaultParams).length > 0) {
      config.defaultParams = defaultParams;
    }

    console.log('🔧 Configuration:', JSON.stringify(config, null, 2));

    const provider = new FixerProvider(config);

    console.log('✅ Provider initialized:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test getting exchange rates
    const rates = await provider.getExchangeRates('EUR');
    console.log('✅ Exchange rates for EUR:');
    console.log('  - USD:', rates.rates.USD);
    console.log('  - GBP:', rates.rates.GBP);
    console.log('  - JPY:', rates.rates.JPY);
    console.log('  - Date:', rates.date);

    // Test currency converter
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'EUR', 'USD');
    console.log('✅ Conversion result (100 EUR to USD):');
    console.log('  - Amount:', result.convertedAmount);
    console.log('  - Rate:', result.rate);

    // Test supported currencies
    if (provider.getSupportedCurrencies) {
      const currencies = await provider.getSupportedCurrencies();
      console.log('✅ Supported currencies count:', currencies.length);
      console.log('  - First 10:', currencies.slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ Fixer Error:', error.message);
  }
}

async function testOpenExchangeRatesProviderWithOptions(options = {}) {
  console.log('\n🔄 Testing Open Exchange Rates Provider with custom options...');
  console.log('='.repeat(50));
  
  try {
    const config = {
      apiKey: options.key || '593c87f8086f8379ce09d8ce',
    };
    
    // Add optional parameters if provided
    if (options.baseUrl) config.baseUrl = options.baseUrl;
    if (options.plan) config.plan = options.plan;
    if (options.timeout) config.timeout = options.timeout;
    if (options.retries) config.retries = options.retries;
    
    // Build defaultParams from command line options
    const defaultParams = {};
    if (options.show_alternative !== undefined) defaultParams.show_alternative = options.show_alternative;
    if (options.prettyprint) defaultParams.prettyprint = options.prettyprint;
    if (Object.keys(defaultParams).length > 0) {
      config.defaultParams = defaultParams;
    }

    console.log('🔧 Configuration:', JSON.stringify(config, null, 2));

    const provider = new OpenExchangeRatesProvider(config);

    console.log('✅ Provider initialized:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test getting exchange rates
    const rates = await provider.getExchangeRates('USD');
    console.log('✅ Exchange rates for USD:');
    console.log('  - EUR:', rates.rates.EUR);
    console.log('  - GBP:', rates.rates.GBP);
    console.log('  - JPY:', rates.rates.JPY);
    console.log('  - Date:', rates.date);

    // Test currency converter
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'USD', 'GBP');
    console.log('✅ Conversion result (100 USD to GBP):');
    console.log('  - Amount:', result.convertedAmount);
    console.log('  - Rate:', result.rate);

    // Test supported currencies
    if (provider.getSupportedCurrencies) {
      const currencies = await provider.getSupportedCurrencies();
      console.log('✅ Supported currencies count:', currencies.length);
      console.log('  - First 10:', currencies.slice(0, 10).join(', '));
    }

  } catch (error) {
    console.error('❌ Open Exchange Rates Error:', error.message);
  }
}

async function testCustomConfigurationWithOptions(options = {}) {
  console.log('\n🔄 Testing Custom Configuration with command line options...');
  console.log('='.repeat(50));
  
  try {
    const config = {
      apiKey: options.key || 'YOUR_CURRENCYLAYER_API_KEY_HERE',
      baseUrl: options.baseUrl || 'https://apilayer.net/api',
      timeout: options.timeout || 15000,
      retries: options.retries || 5
    };
    
    // Build defaultParams from command line options
    const defaultParams = {
      format: options.format || 1,
      precision: options.precision || 6,
      source: 'USD'
    };
    config.defaultParams = defaultParams;

    console.log('🔧 Custom Configuration:', JSON.stringify(config, null, 2));

    const provider = new CurrencyLayerProvider(config);

    console.log('✅ Custom config provider initialized');
    console.log('✅ Provider name:', provider.name);
    console.log('✅ Config valid:', provider.isConfigValid());

    // Test với custom config
    const rates = await provider.getExchangeRates('USD');
    console.log('✅ Custom config working - got rates for', Object.keys(rates.rates).length, 'currencies');

  } catch (error) {
    console.error('❌ Custom Config Error:', error.message);
  }
}

// =============================================================================
// COMMAND LINE INTERFACE
// =============================================================================

function printUsage() {
  console.log('🚀 CURRENCY CONVERTER MANUAL TESTING');
  console.log('='.repeat(70));
  console.log('📝 Usage:');
  console.log('');
  console.log('Run all tests:');
  console.log('  node test-manual.js');
  console.log('');
  console.log('Test specific provider:');
  console.log('  node test-manual.js --provider currencylayer');
  console.log('  node test-manual.js --provider fixer');
  console.log('  node test-manual.js --provider openexchangerates');
  console.log('  node test-manual.js --provider custom');
  console.log('');
  console.log('Test with specific options:');
  console.log('  node test-manual.js --provider currencylayer --key YOUR_API_KEY');
  console.log('  node test-manual.js --provider fixer --key YOUR_API_KEY --baseUrl https://custom.api.com');
  console.log('  node test-manual.js --provider openexchangerates --key YOUR_API_KEY --plan free');
  console.log('');
  console.log('Available options:');
  console.log('  --provider    Provider to test (currencylayer, fixer, openexchangerates, custom)');
  console.log('  --key         API key');
  console.log('  --baseUrl     Custom base URL');
  console.log('  --useHttps    Use HTTPS (true/false)');
  console.log('  --plan        Plan type (free/developer/enterprise)');
  console.log('  --timeout     Timeout in ms');
  console.log('  --retries     Number of retries');
  console.log('  --format      Format parameter');
  console.log('  --precision   Precision parameter');
  console.log('='.repeat(70));
}

function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.substring(2);
      const value = args[i + 1];
      
      if (value && !value.startsWith('--')) {
        // Convert string values to appropriate types
        if (value === 'true') options[key] = true;
        else if (value === 'false') options[key] = false;
        else if (!isNaN(value)) options[key] = parseInt(value);
        else options[key] = value;
        i++; // Skip next argument as it's the value
      } else {
        options[key] = true;
      }
    }
  }
  
  return options;
}

async function runSpecificTest(provider, options = {}) {
  console.log(`\n🔄 Testing ${provider} with custom options...`);
  console.log('Options:', JSON.stringify(options, null, 2));
  console.log('='.repeat(50));
  
  try {
    switch (provider.toLowerCase()) {
      case 'currencylayer':
        await testCurrencyLayerProviderWithOptions(options);
        break;
      case 'fixer':
        await testFixerProviderWithOptions(options);
        break;
      case 'openexchangerates':
        await testOpenExchangeRatesProviderWithOptions(options);
        break;
      case 'custom':
        await testCustomConfigurationWithOptions(options);
        break;
      default:
        console.error('❌ Unknown provider:', provider);
        console.log('Available providers: currencylayer, fixer, openexchangerates, custom');
        return;
    }
  } catch (error) {
    console.error(`❌ Error testing ${provider}:`, error.message);
  }
}

async function runAllTests() {
  console.log('🚀 CURRENCY CONVERTER MANUAL TESTING');
  console.log('='.repeat(70));
  console.log('📝 Running all provider tests...');
  console.log('='.repeat(70));

  // Kiểm tra build đã tồn tại chưa
  try {
    require('./dist/index.js');
  } catch (error) {
    console.error('❌ Build not found! Run: npm run build');
    process.exit(1);
  }

  // Chạy từng test
  await testCurrencyLayerProvider();
  await testFixerProvider();
  await testOpenExchangeRatesProvider();
  await testCustomConfiguration();

  console.log('\n🎉 Manual testing completed!');
  console.log('='.repeat(70));
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const options = parseArguments();
  
  if (options.help || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }
  
  if (args.length === 0) {
    await runAllTests();
    return;
  }
  
  // Kiểm tra build đã tồn tại chưa
  try {
    require('./dist/index.js');
  } catch (error) {
    console.error('❌ Build not found! Run: npm run build');
    process.exit(1);
  }
  
  if (options.provider) {
    await runSpecificTest(options.provider, options);
  } else {
    await runAllTests();
  }
}

// Chạy test nếu script được gọi trực tiếp
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCurrencyLayerProvider,
  testFixerProvider,
  testOpenExchangeRatesProvider,
  testCustomConfiguration,
  testCurrencyLayerProviderWithOptions,
  testFixerProviderWithOptions,
  testOpenExchangeRatesProviderWithOptions,
  testCustomConfigurationWithOptions
};
