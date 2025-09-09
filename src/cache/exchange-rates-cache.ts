import { ExchangeRates } from '../types';

export interface ExchangeRatesCacheConfig {
  ttl?: number; // Time to live in seconds, default 1 hour (3600)
  keyPrefix?: string; // Redis key prefix, default 'exchange_rates'
}

export class ExchangeRatesCache {
  private client: any;
  private config: Required<ExchangeRatesCacheConfig>;

  constructor(redisClient: any, config: ExchangeRatesCacheConfig = {}) {
    this.client = redisClient;
    this.config = {
      ttl: config.ttl || 3600, // 1 hour default
      keyPrefix: config.keyPrefix || 'exchange_rates',
    };
  }

  private getKey(providerName: string, baseCurrency: string): string {
    return `${this.config.keyPrefix}:${providerName}:${baseCurrency}`;
  }

  /**
   * Cache exchange rates for a provider and base currency
   */
  public async setRates(
    providerName: string, 
    baseCurrency: string, 
    rates: ExchangeRates,
    customTtl?: number
  ): Promise<void> {
    try {
      const key = this.getKey(providerName, baseCurrency);
      const ttl = customTtl || this.config.ttl;
      const data = JSON.stringify({
        rates,
        timestamp: Date.now(),
        baseCurrency: baseCurrency.toUpperCase(),
        provider: providerName,
      });

      if (this.client.setEx) {
        // Redis v4+
        await this.client.setEx(key, ttl, data);
      } else {
        // Redis v3 or older
        await this.client.set(key, data, 'EX', ttl);
      }

      console.log(`✅ Cached ${Object.keys(rates).length} rates for ${providerName}:${baseCurrency} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error('Failed to cache exchange rates:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Get cached exchange rates for a provider and base currency
   */
  public async getRates(providerName: string, baseCurrency: string): Promise<ExchangeRates | null> {
    try {
      const key = this.getKey(providerName, baseCurrency);
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      const parsed = JSON.parse(data);
      
      // Validate data structure
      if (!parsed.rates || !parsed.timestamp || !parsed.baseCurrency || !parsed.provider) {
        console.warn('Invalid cached data structure, removing cache');
        await this.client.del(key);
        return null;
      }

      // Check if data is for the right provider and currency
      if (parsed.provider !== providerName || parsed.baseCurrency !== baseCurrency.toUpperCase()) {
        console.warn('Cached data mismatch, removing cache');
        await this.client.del(key);
        return null;
      }

      console.log(`✅ Retrieved ${Object.keys(parsed.rates).length} cached rates for ${providerName}:${baseCurrency}`);
      return parsed.rates;
    } catch (error) {
      console.error('Failed to get cached exchange rates:', error);
      return null;
    }
  }

  /**
   * Check if rates are cached for a provider and base currency
   */
  public async hasRates(providerName: string, baseCurrency: string): Promise<boolean> {
    try {
      const key = this.getKey(providerName, baseCurrency);
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Failed to check cache existence:', error);
      return false;
    }
  }

  /**
   * Get TTL for cached rates
   */
  public async getTTL(providerName: string, baseCurrency: string): Promise<number> {
    try {
      const key = this.getKey(providerName, baseCurrency);
      return await this.client.ttl(key);
    } catch (error) {
      console.error('Failed to get cache TTL:', error);
      return -1;
    }
  }

  /**
   * Clear cached rates for a specific provider and base currency
   */
  public async clearRates(providerName: string, baseCurrency: string): Promise<void> {
    try {
      const key = this.getKey(providerName, baseCurrency);
      await this.client.del(key);
      console.log(`✅ Cleared cache for ${providerName}:${baseCurrency}`);
    } catch (error) {
      console.error('Failed to clear cached rates:', error);
    }
  }

  /**
   * Clear all cached rates for a provider
   */
  public async clearProviderRates(providerName: string): Promise<void> {
    try {
      const pattern = `${this.config.keyPrefix}:${providerName}:*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`✅ Cleared ${keys.length} cached rate sets for ${providerName}`);
      }
    } catch (error) {
      console.error('Failed to clear provider rates:', error);
    }
  }

  /**
   * Clear all cached exchange rates
   */
  public async clearAll(): Promise<void> {
    try {
      const pattern = `${this.config.keyPrefix}:*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`✅ Cleared all ${keys.length} cached rate sets`);
      }
    } catch (error) {
      console.error('Failed to clear all cached rates:', error);
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<{
    totalKeys: number;
    providers: string[];
    currencies: string[];
    oldestTimestamp?: number;
    newestTimestamp?: number;
  }> {
    try {
      const pattern = `${this.config.keyPrefix}:*`;
      const keys = await this.client.keys(pattern);
      
      const providers = new Set<string>();
      const currencies = new Set<string>();
      let oldestTimestamp = Infinity;
      let newestTimestamp = 0;

      for (const key of keys) {
        // Parse key: exchange_rates:provider:currency
        const parts = key.split(':');
        if (parts.length >= 3) {
          providers.add(parts[1]);
          currencies.add(parts[2]);
        }

        // Get timestamp from data
        try {
          const data = await this.client.get(key);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.timestamp) {
              oldestTimestamp = Math.min(oldestTimestamp, parsed.timestamp);
              newestTimestamp = Math.max(newestTimestamp, parsed.timestamp);
            }
          }
        } catch (error) {
          // Skip invalid data
        }
      }

      return {
        totalKeys: keys.length,
        providers: Array.from(providers),
        currencies: Array.from(currencies),
        oldestTimestamp: oldestTimestamp === Infinity ? undefined : oldestTimestamp,
        newestTimestamp: newestTimestamp === 0 ? undefined : newestTimestamp,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        providers: [],
        currencies: [],
      };
    }
  }

  /**
   * Refresh rates for a provider (clear cache to force fresh fetch)
   */
  public async refreshRates(providerName: string, baseCurrency?: string): Promise<void> {
    if (baseCurrency) {
      await this.clearRates(providerName, baseCurrency);
    } else {
      await this.clearProviderRates(providerName);
    }
  }
}
