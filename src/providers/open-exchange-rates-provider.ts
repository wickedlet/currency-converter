import { BaseCurrencyProvider } from './base-provider';
import { ExchangeRateResponse, ProviderConfig } from '../types';

export interface OpenExchangeRatesConfig extends ProviderConfig {
  apiKey: string;
  plan?: 'free' | 'developer' | 'enterprise';
}

export class OpenExchangeRatesProvider extends BaseCurrencyProvider {
  public readonly name = 'Open Exchange Rates';
  protected readonly baseUrl = 'https://v6.exchangerate-api.com/v6';
  protected readonly defaultTimeout = 5000;

  constructor(config: OpenExchangeRatesConfig) {
    super(config);
    
    if (!this.isConfigValid()) {
      throw new Error('Open Exchange Rates API key is required');
    }
  }

  public isConfigValid(): boolean {
    return !!(this.config as OpenExchangeRatesConfig).apiKey;
  }

  protected async getExchangeRatesFromAPI(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      const config = this.config as OpenExchangeRatesConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: `/${config.apiKey}/latest/${normalizedBase}`
      };

      const data = await this.makeRequest(requestConfig);

      if (data.error) {
        return this.formatResponse(
          false,
          normalizedBase,
          null,
          data.description || 'Failed to fetch exchange rates from Open Exchange Rates'
        );
      }

      // Open Exchange Rates returns rates object with currency codes as keys
      const rates = data.conversion_rates || {};
      
      // Ensure base currency is included with rate 1
      rates[normalizedBase] = 1;

      return {
        success: true,
        base: normalizedBase,
        date: new Date(data.time_last_update_unix * 1000).toISOString().split('T')[0],
        rates,
      };
    } catch (error: any) {
      return this.formatResponse(
        false,
        this.normalizeCurrencyCode(baseCurrency),
        null,
        `Open Exchange Rates API error: ${error.message}`
      );
    }
  }

  /**
   * Get supported currencies from Open Exchange Rates
   */
  public async getSupportedCurrencies(): Promise<string[]> {
    try {
      const config = this.config as OpenExchangeRatesConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/currencies.json',
        params: {
          app_id: config.apiKey,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (data.error) {
        throw new Error(data.description || 'Failed to fetch supported currencies');
      }

      return Object.keys(data);
    } catch (error: any) {
      throw new Error(`Failed to get supported currencies: ${error.message}`);
    }
  }

  /**
   * Get time-series data (Enterprise plan only)
   */
  public async getTimeSeries(
    start: string, 
    end: string, 
    baseCurrency: string = 'USD',
    symbols?: string[]
  ): Promise<any> {
    try {
      const config = this.config as OpenExchangeRatesConfig;
      
      if (config.plan !== 'enterprise') {
        throw new Error('Time-series data requires Enterprise plan');
      }

      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        throw new Error('Dates must be in YYYY-MM-DD format');
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      
      const params: any = {
        app_id: config.apiKey,
        start,
        end,
        base: normalizedBase,
      };

      if (symbols && symbols.length > 0) {
        params.symbols = symbols.join(',');
      }

      const requestConfig = {
        method: 'GET' as const,
        url: '/time-series.json',
        params,
      };

      const data = await this.makeRequest(requestConfig);

      if (data.error) {
        throw new Error(data.description || 'Failed to fetch time-series data');
      }

      return {
        success: true,
        base: data.base,
        start_date: data.start_date,
        end_date: data.end_date,
        rates: data.rates,
      };
    } catch (error: any) {
      throw new Error(`Time-series data error: ${error.message}`);
    }
  }

  /**
   * Convert specific amount between currencies (Paid plans only)
   */
  public async convertAmount(
    amount: number,
    from: string,
    to: string
  ): Promise<any> {
    try {
      const config = this.config as OpenExchangeRatesConfig;
      
      if (config.plan === 'free') {
        throw new Error('Currency conversion requires a paid plan');
      }

      if (!this.validateCurrencyCode(from) || !this.validateCurrencyCode(to)) {
        throw new Error('Invalid currency codes');
      }

      const normalizedFrom = this.normalizeCurrencyCode(from);
      const normalizedTo = this.normalizeCurrencyCode(to);

      const requestConfig = {
        method: 'GET' as const,
        url: '/convert',
        params: {
          app_id: config.apiKey,
          from: normalizedFrom,
          to: normalizedTo,
          amount,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (data.error) {
        throw new Error(data.description || 'Currency conversion failed');
      }

      return {
        success: true,
        query: {
          from: data.request.query,
          to: data.request.to,
          amount: data.request.amount,
        },
        info: {
          rate: data.info.rate,
          timestamp: data.info.timestamp,
        },
        historical: data.historical || false,
        date: new Date(data.info.timestamp * 1000).toISOString().split('T')[0],
        result: data.result,
      };
    } catch (error: any) {
      throw new Error(`Currency conversion error: ${error.message}`);
    }
  }

  /**
   * Get usage statistics (shows API usage information)
   */
  public async getUsage(): Promise<any> {
    try {
      const config = this.config as OpenExchangeRatesConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/usage.json',
        params: {
          app_id: config.apiKey,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (data.error) {
        throw new Error(data.description || 'Failed to fetch usage data');
      }

      return {
        success: true,
        plan: data.plan,
        quota: data.quota,
        usage: data.usage,
        days_elapsed: data.days_elapsed,
        days_remaining: data.days_remaining,
        daily_average: data.daily_average,
      };
    } catch (error: any) {
      throw new Error(`Usage data error: ${error.message}`);
    }
  }
}
