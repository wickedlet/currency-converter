/**
 * Example for batch/multiple currency conversions
 */
import { CurrencyConverter, ExchangeRateApiProvider } from '@wickedlet/currency-converter';

async function batchConversionExample() {
  try {
    // Use ExchangeRate-API free tier for this example
    const provider = new ExchangeRateApiProvider({
      plan: 'free',
    });

    const converter = new CurrencyConverter({
      provider,
    });

    console.log('=== Batch Currency Conversions ===');
    
    // Define multiple conversions
    const conversions = [
      { amount: 100, from: 'USD', to: 'EUR' },
      { amount: 50, from: 'GBP', to: 'JPY' },
      { amount: 200, from: 'CAD', to: 'AUD' },
      { amount: 75, from: 'EUR', to: 'CHF' },
      { amount: 1000, from: 'JPY', to: 'KRW' },
      { amount: 25, from: 'AUD', to: 'NZD' },
    ];

    console.log('Converting:', conversions);
    
    const start = Date.now();
    const results = await converter.convertMultiple(conversions);
    const time = Date.now() - start;

    console.log('\nResults:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.amount} ${result.from} = ${result.convertedAmount} ${result.to} (Rate: ${result.rate})`);
    });

    console.log(`\nBatch conversion completed in ${time}ms`);

    console.log('\n=== Individual vs Batch Performance ===');
    
    // Individual conversions
    const startIndividual = Date.now();
    for (const conversion of conversions) {
      await converter.convertCurrency(conversion.amount, conversion.from, conversion.to);
    }
    const timeIndividual = Date.now() - startIndividual;

    // Batch conversion
    const startBatch = Date.now();
    await converter.convertMultiple(conversions);
    const timeBatch = Date.now() - startBatch;

    console.log(`Individual conversions: ${timeIndividual}ms`);
    console.log(`Batch conversion: ${timeBatch}ms`);
    console.log(`Performance difference: ${timeIndividual - timeBatch}ms`);

    console.log('\n=== Portfolio Conversion Example ===');
    
    // Example: Convert a portfolio to USD
    const portfolio = [
      { amount: 1000, from: 'EUR', to: 'USD', asset: 'European Stocks' },
      { amount: 500000, from: 'JPY', to: 'USD', asset: 'Japanese Bonds' },
      { amount: 750, from: 'GBP', to: 'USD', asset: 'UK Real Estate' },
      { amount: 2000, from: 'CAD', to: 'USD', asset: 'Canadian Commodities' },
    ];

    const portfolioConversions = portfolio.map(item => ({
      amount: item.amount,
      from: item.from,
      to: item.to,
    }));

    const portfolioResults = await converter.convertMultiple(portfolioConversions);
    
    let totalUSD = 0;
    console.log('Portfolio in USD:');
    portfolioResults.forEach((result, index) => {
      const asset = portfolio[index];
      console.log(`${asset.asset}: ${result.amount} ${result.from} = $${result.convertedAmount.toLocaleString()} USD`);
      totalUSD += result.convertedAmount;
    });

    console.log(`\nTotal Portfolio Value: $${totalUSD.toLocaleString()} USD`);

    console.log('\n=== Cross Currency Matrix ===');
    
    // Create a currency conversion matrix
    const currencies = ['USD', 'EUR', 'GBP', 'JPY'];
    const amount = 100;

    console.log('Cross-currency matrix for', amount, 'units:');
    console.log('From\\To\t', currencies.join('\t'));

    for (const fromCurrency of currencies) {
      const matrixConversions = currencies.map(toCurrency => ({
        amount,
        from: fromCurrency,
        to: toCurrency,
      }));

      const matrixResults = await converter.convertMultiple(matrixConversions);
      const row = matrixResults.map(result => 
        result.from === result.to ? amount.toFixed(2) : result.convertedAmount.toFixed(2)
      );
      
      console.log(`${fromCurrency}\t`, row.join('\t'));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  batchConversionExample();
}
