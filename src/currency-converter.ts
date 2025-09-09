import { 
  ICurrencyProvider, 
  CurrencyConverterConfig, 
  ConversionResult, 
  ExchangeRates,
  CacheManager 
} from './types';
import { RedisCacheManager } from './cache/redis-cache-manager';
import { ExchangeRatesCache } from './cache/exchange-rates-cache';

export class CurrencyConverter {
  private provider: ICurrencyProvider;
  private cacheManager?: CacheManager;
  private ratesCache?: ExchangeRatesCache;
  private enableCache: boolean;

  constructor(config: CurrencyConverterConfig) {
    this.provider = config.provider;
    this.enableCache = !!config.cache;

    if (config.cache) {
      this.cacheManager = new RedisCacheManager(
        config.cache.client,
        config.cache.config
      );
      
      // Create exchange rates cache with same Redis client
      this.ratesCache = new ExchangeRatesCache(
        config.cache.client,
        {
          ttl: config.cache.config?.ttl || 3600, // Default 1 hour
          keyPrefix: 'exchange_rates',
        }
      );
      
      // Set cache on provider
      if (this.provider && typeof (this.provider as any).setRatesCache === 'function') {
        (this.provider as any).setRatesCache(this.ratesCache);
      }
    }
  }

  /**
   * Convert amount from one currency to another
   */
  public async convertCurrency(
    amount: number, 
    from: string, 
    to: string
  ): Promise<ConversionResult> {
    const fromCurrency = from.toUpperCase().trim();
    const toCurrency = to.toUpperCase().trim();

    // Validate input
    if (amount < 0) {
      throw new Error('Amount must be positive');
    }

    if (!this.isValidCurrencyCode(fromCurrency) || !this.isValidCurrencyCode(toCurrency)) {
      throw new Error('Invalid currency codes');
    }

    // If currencies are the same, return original amount
    if (fromCurrency === toCurrency) {
      return {
        amount,
        from: fromCurrency,
        to: toCurrency,
        convertedAmount: amount,
        rate: 1,
        timestamp: new Date().toISOString(),
        cached: false,
      };
    }

    try {
      // Try to get rates from cache first
      let rates: ExchangeRates | null = null;
      let cached = false;

      if (this.enableCache && this.cacheManager) {
        const cachedRates = await this.cacheManager.get(`rates:${fromCurrency}`);
        if (cachedRates) {
          rates = JSON.parse(cachedRates);
          cached = true;
        }
      }

      // If no cached rates, fetch from provider
      if (!rates) {
        const response = await this.provider.getExchangeRates(fromCurrency);
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch exchange rates');
        }

        rates = response.rates;

        // Cache the rates if caching is enabled
        if (this.enableCache && this.cacheManager && rates) {
          await this.cacheManager.set(
            `rates:${fromCurrency}`,
            JSON.stringify(rates)
          );
        }
      }

      // Check if we have the required rates
      if (!rates || !rates[fromCurrency] || !rates[toCurrency]) {
        throw new Error(`Exchange rates not available for ${fromCurrency} to ${toCurrency}`);
      }

      // Calculate converted amount
      const rate = rates[toCurrency] / rates[fromCurrency];
      const convertedAmount = Number((amount * rate).toFixed(2));

      return {
        amount,
        from: fromCurrency,
        to: toCurrency,
        convertedAmount,
        rate: Number(rate.toFixed(6)),
        timestamp: new Date().toISOString(),
        cached,
      };
    } catch (error: any) {
      throw new Error(`Currency conversion failed: ${error.message}`);
    }
  }

  /**
   * Get exchange rates for a base currency
   */
  public async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    const normalizedBase = baseCurrency.toUpperCase().trim();

    if (!this.isValidCurrencyCode(normalizedBase)) {
      throw new Error(`Invalid base currency code: ${baseCurrency}`);
    }

    try {
      // Try cache first
      if (this.enableCache && this.cacheManager) {
        const cachedRates = await this.cacheManager.get(`rates:${normalizedBase}`);
        if (cachedRates) {
          return JSON.parse(cachedRates);
        }
      }

      // Fetch from provider
      const response = await this.provider.getExchangeRates(normalizedBase);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch exchange rates');
      }

      const rates = response.rates;

      // Cache the rates
      if (this.enableCache && this.cacheManager && rates) {
        await this.cacheManager.set(
          `rates:${normalizedBase}`,
          JSON.stringify(rates)
        );
      }

      return rates;
    } catch (error: any) {
      throw new Error(`Failed to get exchange rates: ${error.message}`);
    }
  }

  /**
   * Get the current exchange rate between two currencies
   */
  public async getExchangeRate(from: string, to: string): Promise<number> {
    const fromCurrency = from.toUpperCase().trim();
    const toCurrency = to.toUpperCase().trim();

    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await this.getExchangeRates(fromCurrency);
    
    if (!rates[toCurrency]) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    return Number((rates[toCurrency] / rates[fromCurrency]).toFixed(6));
  }

  /**
   * Clear cached exchange rates
   */
  public async clearCache(baseCurrency?: string): Promise<void> {
    if (!this.enableCache || !this.cacheManager) {
      return;
    }

    if (baseCurrency) {
      const normalizedBase = baseCurrency.toUpperCase().trim();
      await this.cacheManager.del(`rates:${normalizedBase}`);
    } else {
      if (this.cacheManager.clear) {
        await this.cacheManager.clear('rates:*');
      }
    }
  }

  /**
   * Check if exchange rates are cached for a currency
   */
  public async isCached(baseCurrency: string): Promise<boolean> {
    if (!this.enableCache || !this.cacheManager) {
      return false;
    }

    const normalizedBase = baseCurrency.toUpperCase().trim();
    const cachedRates = await this.cacheManager.get(`rates:${normalizedBase}`);
    return !!cachedRates;
  }

  /**
   * Get cache TTL for a currency
   */
  public async getCacheTTL(baseCurrency: string): Promise<number> {
    if (!this.enableCache || !this.cacheManager || !('ttl' in this.cacheManager)) {
      return -1;
    }

    const normalizedBase = baseCurrency.toUpperCase().trim();
    return (this.cacheManager as any).ttl(`rates:${normalizedBase}`);
  }

  /**
   * Change the provider
   */
  public setProvider(provider: ICurrencyProvider): void {
    this.provider = provider;
    
    // Set cache on new provider if available
    if (this.ratesCache && typeof (provider as any).setRatesCache === 'function') {
      (provider as any).setRatesCache(this.ratesCache);
    }
  }

  /**
   * Get current provider name
   */
  public getProviderName(): string {
    return this.provider.name;
  }

  /**
   * Convert multiple amounts at once
   */
  public async convertMultiple(
    conversions: Array<{ amount: number; from: string; to: string }>
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    for (const conversion of conversions) {
      try {
        const result = await this.convertCurrency(
          conversion.amount,
          conversion.from,
          conversion.to
        );
        results.push(result);
      } catch (error: any) {
        // Continue with other conversions even if one fails
        results.push({
          amount: conversion.amount,
          from: conversion.from.toUpperCase(),
          to: conversion.to.toUpperCase(),
          convertedAmount: 0,
          rate: 0,
          timestamp: new Date().toISOString(),
          cached: false,
        });
      }
    }

    return results;
  }

  private isValidCurrencyCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code);
  }

  /**
   * Get exchange rates cache statistics
   */
  public async getCacheStats(): Promise<any> {
    if (!this.ratesCache) {
      return { error: 'Cache not enabled' };
    }
    
    return this.ratesCache.getStats();
  }

  /**
   * Check if rates are cached for current provider
   */
  public async isProviderRatesCached(baseCurrency: string = 'USD'): Promise<boolean> {
    if (!this.ratesCache || !this.provider) {
      return false;
    }
    
    return this.ratesCache.hasRates(this.provider.name, baseCurrency);
  }

  /**
   * Get cache TTL for current provider rates
   */
  public async getProviderRatesCacheTTL(baseCurrency: string = 'USD'): Promise<number> {
    if (!this.ratesCache || !this.provider) {
      return -1;
    }
    
    return this.ratesCache.getTTL(this.provider.name, baseCurrency);
  }

  /**
   * Force refresh rates for current provider
   */
  public async refreshProviderRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    if (!this.provider) {
      throw new Error('No provider configured');
    }

    // Force refresh if provider supports it
    if (typeof (this.provider as any).refreshRates === 'function') {
      const response = await (this.provider as any).refreshRates(baseCurrency);
      if (response.success) {
        return response.rates;
      }
      throw new Error(response.error || 'Failed to refresh rates');
    }

    // Fallback: clear cache and get fresh rates
    if (this.ratesCache) {
      await this.ratesCache.clearRates(this.provider.name, baseCurrency);
    }
    
    return this.getExchangeRates(baseCurrency);
  }

  /**
   * Clear all cached rates for current provider
   */
  public async clearProviderCache(): Promise<void> {
    if (!this.ratesCache || !this.provider) {
      return;
    }
    
    await this.ratesCache.clearProviderRates(this.provider.name);
  }

  /**
   * Clear all exchange rates cache
   */
  public async clearAllRatesCache(): Promise<void> {
    if (!this.ratesCache) {
      return;
    }
    
    await this.ratesCache.clearAll();
  }
}
