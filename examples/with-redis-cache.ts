/**
 * Example with Redis caching
 */
import { createClient } from 'redis';
import { CurrencyConverter, FixerProvider } from '@wickedlet/currency-converter';

async function redisCacheExample() {
  let redisClient: any;
  
  try {
    // Setup Redis client
    redisClient = createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    redisClient.on('error', (err: any) => {
      console.log('Redis Client Error', err);
    });

    await redisClient.connect();
    console.log('Connected to Redis');

    // Initialize provider
    const provider = new FixerProvider({
      apiKey: process.env.FIXER_API_KEY || 'your-fixer-api-key',
    });

    // Create converter with caching
    const converter = new CurrencyConverter({
      provider,
      cache: {
        client: redisClient,
        config: {
          ttl: 3600, // 1 hour
          keyPrefix: 'example_currency',
        },
      },
    });

    console.log('\n=== First Conversion (will fetch from API) ===');
    const start1 = Date.now();
    const result1 = await converter.convertCurrency(100, 'USD', 'EUR');
    const time1 = Date.now() - start1;
    console.log('100 USD to EUR:', result1);
    console.log(`Time taken: ${time1}ms, Cached: ${result1.cached}`);

    console.log('\n=== Second Conversion (will use cache) ===');
    const start2 = Date.now();
    const result2 = await converter.convertCurrency(200, 'USD', 'GBP');
    const time2 = Date.now() - start2;
    console.log('200 USD to GBP:', result2);
    console.log(`Time taken: ${time2}ms, Cached: ${result2.cached}`);

    console.log('\n=== Cache Information ===');
    const isCached = await converter.isCached('USD');
    console.log('USD rates cached:', isCached);

    const ttl = await converter.getCacheTTL('USD');
    console.log(`Cache TTL: ${ttl} seconds`);

    console.log('\n=== Clear Cache and Try Again ===');
    await converter.clearCache('USD');
    
    const start3 = Date.now();
    const result3 = await converter.convertCurrency(100, 'USD', 'EUR');
    const time3 = Date.now() - start3;
    console.log('100 USD to EUR after cache clear:', result3);
    console.log(`Time taken: ${time3}ms, Cached: ${result3.cached}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Clean up
    if (redisClient) {
      await redisClient.quit();
      console.log('\nDisconnected from Redis');
    }
  }
}

// Run the example
if (require.main === module) {
  redisCacheExample();
}
