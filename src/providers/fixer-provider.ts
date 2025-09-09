import { BaseCurrencyProvider } from './base-provider';
import { ExchangeRateResponse, ProviderConfig } from '../types';

export interface FixerConfig extends ProviderConfig {
  apiKey: string;
  useHttps?: boolean;
}

export class FixerProvider extends BaseCurrencyProvider {
  public readonly name = 'Fixer.io';
  protected readonly baseUrl = 'http://data.fixer.io';
  protected readonly defaultTimeout = 5000;
  
  private readonly httpsBaseUrl = 'https://api.fixer.io';

  constructor(config: FixerConfig) {
    super(config);
    
    if (!this.isConfigValid()) {
      throw new Error('Fixer API key is required');
    }

    // Use HTTPS URL if specified in config
    if (config.useHttps) {
      this.httpClient.defaults.baseURL = this.httpsBaseUrl;
    }
  }

  public isConfigValid(): boolean {
    return !!(this.config as FixerConfig).apiKey;
  }

  protected async getExchangeRatesFromAPI(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      const config = this.config as FixerConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/api/latest',
        params: {
          access_key: config.apiKey,
          base: normalizedBase,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        return this.formatResponse(
          false,
          normalizedBase,
          null,
          data.error?.info || 'Failed to fetch exchange rates from Fixer.io'
        );
      }

      // Fixer.io returns rates object with currency codes as keys
      const rates = data.rates || {};
      
      // Ensure base currency is included with rate 1
      rates[normalizedBase] = 1;

      return this.formatResponse(true, normalizedBase, rates);
    } catch (error: any) {
      return this.formatResponse(
        false,
        this.normalizeCurrencyCode(baseCurrency),
        null,
        `Fixer.io API error: ${error.message}`
      );
    }
  }

  /**
   * Get supported currencies from Fixer.io
   */
  public async getSupportedCurrencies(): Promise<string[]> {
    try {
      const config = this.config as FixerConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/api/symbols',
        params: {
          access_key: config.apiKey,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (data.success && data.symbols) {
        return Object.keys(data.symbols);
      }

      throw new Error('Failed to fetch supported currencies');
    } catch (error: any) {
      throw new Error(`Failed to get supported currencies: ${error.message}`);
    }
  }

  /**
   * Get historical exchange rates for a specific date
   */
  public async getHistoricalRates(date: string, baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Date must be in YYYY-MM-DD format');
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      const config = this.config as FixerConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: `/api/${date}`,
        params: {
          access_key: config.apiKey,
          base: normalizedBase,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        return this.formatResponse(
          false,
          normalizedBase,
          null,
          data.error?.info || 'Failed to fetch historical rates from Fixer.io'
        );
      }

      const rates = data.rates || {};
      rates[normalizedBase] = 1;

      return {
        ...this.formatResponse(true, normalizedBase, rates),
        date: data.date || date,
      };
    } catch (error: any) {
      return this.formatResponse(
        false,
        this.normalizeCurrencyCode(baseCurrency),
        null,
        `Fixer.io historical API error: ${error.message}`
      );
    }
  }
}
