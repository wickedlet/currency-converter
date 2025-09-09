import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ICurrencyProvider, ExchangeRateResponse, ProviderConfig } from '../types';
import { ExchangeRatesCache } from '../cache/exchange-rates-cache';

export abstract class BaseCurrencyProvider implements ICurrencyProvider {
  protected httpClient: AxiosInstance;
  protected config: ProviderConfig;
  protected ratesCache?: ExchangeRatesCache;
  
  public abstract readonly name: string;
  protected abstract readonly baseUrl: string;
  protected abstract readonly defaultTimeout: number;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      timeout: config.timeout || this.getDefaultTimeout(),
      retries: 3,
      ...config,
    };

    this.httpClient = axios.create({
      baseURL: this.getBaseUrl(),
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@wickedlet/currency-converter',
      },
    });

    this.setupRetryLogic();
  }

  protected getDefaultTimeout(): number {
    return 5000; // Default timeout
  }

  protected getBaseUrl(): string {
    return this.baseUrl;
  }

  public abstract isConfigValid(): boolean;

  protected async makeRequest(config: AxiosRequestConfig): Promise<any> {
    try {
      // Build full URL manually to avoid axios baseURL issues
      const fullUrl = `${this.getBaseUrl()}${config.url}`;
      // Create new config without baseURL dependency
      const requestConfig = {
        ...config,
        url: fullUrl,
        method: config.method || 'GET'
      };
      
      // Use axios directly instead of instance to avoid baseURL combination
      const response = await axios.request(requestConfig);
      
      return response.data;
    } catch (error: any) {
      throw new Error(`API request failed: ${error.message}`);
    }
  }

  protected setupRetryLogic(): void {
    this.httpClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config;
        
        if (!config || config.retryCount >= (this.config.retries || 3)) {
          return Promise.reject(error);
        }

        config.retryCount = (config.retryCount || 0) + 1;
        
        // Exponential backoff
        const delay = Math.pow(2, config.retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.httpClient.request(config);
      }
    );
  }

  protected formatResponse(success: boolean, base: string, rates: any, error?: string): ExchangeRateResponse {
    return {
      success,
      base: base.toUpperCase(),
      date: new Date().toISOString().split('T')[0],
      rates: rates || {},
      error,
    };
  }

  protected validateCurrencyCode(code: string): boolean {
    return /^[A-Z]{3}$/.test(code.toUpperCase());
  }

  protected normalizeCurrencyCode(code: string): string {
    return code.toUpperCase().trim();
  }

  /**
   * Set the exchange rates cache instance
   */
  public setRatesCache(cache: ExchangeRatesCache): void {
    this.ratesCache = cache;
  }

  /**
   * Get cached exchange rates or fetch from API if not cached
   */
  protected async getCachedOrFreshRates(baseCurrency: string): Promise<ExchangeRateResponse> {
    const normalizedBase = this.normalizeCurrencyCode(baseCurrency);

    // Try to get from cache first
    if (this.ratesCache) {
      try {
        const cachedRates = await this.ratesCache.getRates(this.name, normalizedBase);
        if (cachedRates) {
          return {
            success: true,
            base: normalizedBase,
            date: new Date().toISOString().split('T')[0],
            rates: cachedRates,
          };
        }
      } catch (error) {
        console.warn(`Cache read failed for ${this.name}:${normalizedBase}:`, (error as Error).message);
      }
    }

    // Cache miss or no cache - fetch from API
    const response = await this.getExchangeRatesFromAPI(normalizedBase);

    // Cache the fresh data if successful
    if (response.success && response.rates && this.ratesCache) {
      try {
        await this.ratesCache.setRates(this.name, normalizedBase, response.rates);
      } catch (error) {
        console.warn(`Cache write failed for ${this.name}:${normalizedBase}:`, (error as Error).message);
      }
    }

    return response;
  }

  /**
   * Abstract method that providers must implement to fetch rates from their API
   * This replaces the original getExchangeRates method
   */
  protected abstract getExchangeRatesFromAPI(baseCurrency: string): Promise<ExchangeRateResponse>;

  /**
   * Public method that uses caching strategy
   */
  public async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    return this.getCachedOrFreshRates(baseCurrency);
  }

  /**
   * Force refresh rates (clear cache and fetch fresh)
   */
  public async refreshRates(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
    
    // Clear cache first
    if (this.ratesCache) {
      await this.ratesCache.clearRates(this.name, normalizedBase);
    }
    
    // Fetch fresh data
    return this.getCachedOrFreshRates(normalizedBase);
  }

  /**
   * Check if rates are cached
   */
  public async isRatesCached(baseCurrency: string = 'USD'): Promise<boolean> {
    if (!this.ratesCache) {
      return false;
    }
    
    const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
    return this.ratesCache.hasRates(this.name, normalizedBase);
  }

  /**
   * Get cache TTL for rates
   */
  public async getRatesCacheTTL(baseCurrency: string = 'USD'): Promise<number> {
    if (!this.ratesCache) {
      return -1;
    }
    
    const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
    return this.ratesCache.getTTL(this.name, normalizedBase);
  }
}
