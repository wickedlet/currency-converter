import { BaseCurrencyProvider } from './base-provider';
import { ExchangeRateResponse, ProviderConfig } from '../types';

export interface CurrencyLayerConfig extends ProviderConfig {
  apiKey: string;
  useHttps?: boolean; // Requires paid plan
}

export class CurrencyLayerProvider extends BaseCurrencyProvider {
  public readonly name = 'CurrencyLayer';
  protected readonly baseUrl = 'http://apilayer.net/api';
  protected readonly defaultTimeout = 5000;
  
  private readonly httpsBaseUrl = 'https://apilayer.net/api';

  constructor(config: CurrencyLayerConfig) {
    super(config);
    
    if (!this.isConfigValid()) {
      throw new Error('CurrencyLayer API key is required');
    }

    // Use HTTPS URL if specified in config
    if (config.useHttps) {
      this.httpClient.defaults.baseURL = this.httpsBaseUrl;
    }
  }

  public isConfigValid(): boolean {
    return !!(this.config as CurrencyLayerConfig).apiKey;
  }

  protected async getExchangeRatesFromAPI(baseCurrency: string = 'USD'): Promise<ExchangeRateResponse> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      const config = this.config as CurrencyLayerConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/live',
        params: {
          access_key: config.apiKey,
          source: normalizedBase,
          format: 1,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        return this.formatResponse(
          false,
          normalizedBase,
          null,
          data.error?.info || 'Failed to fetch exchange rates from CurrencyLayer'
        );
      }

      // CurrencyLayer returns quotes object with currency pairs as keys (e.g., USDEUR)
      const quotes = data.quotes || {};
      const rates: { [key: string]: number } = {};
      
      // Extract rates from quotes
      for (const [pair, rate] of Object.entries(quotes)) {
        const pairStr = pair as string;
        const rateNum = rate as number;
        
        // Extract target currency from pair (remove source currency prefix)
        if (pairStr.startsWith(normalizedBase)) {
          const targetCurrency = pairStr.substring(normalizedBase.length);
          rates[targetCurrency] = rateNum;
        }
      }

      // Ensure base currency is included with rate 1
      rates[normalizedBase] = 1;

      return {
        success: true,
        base: normalizedBase,
        date: new Date(data.timestamp * 1000).toISOString().split('T')[0],
        rates,
      };
    } catch (error: any) {
      return this.formatResponse(
        false,
        this.normalizeCurrencyCode(baseCurrency),
        null,
        `CurrencyLayer API error: ${error.message}`
      );
    }
  }

  /**
   * Get supported currencies from CurrencyLayer
   */
  public async getSupportedCurrencies(): Promise<string[]> {
    try {
      const config = this.config as CurrencyLayerConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/list',
        params: {
          access_key: config.apiKey,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        throw new Error(data.error?.info || 'Failed to fetch supported currencies');
      }

      return Object.keys(data.currencies || {});
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
      const config = this.config as CurrencyLayerConfig;
      
      const requestConfig = {
        method: 'GET' as const,
        url: '/historical',
        params: {
          access_key: config.apiKey,
          date,
          source: normalizedBase,
          format: 1,
        },
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        return this.formatResponse(
          false,
          normalizedBase,
          null,
          data.error?.info || 'Failed to fetch historical rates from CurrencyLayer'
        );
      }

      // Extract rates from quotes
      const quotes = data.quotes || {};
      const rates: { [key: string]: number } = {};
      
      for (const [pair, rate] of Object.entries(quotes)) {
        const pairStr = pair as string;
        const rateNum = rate as number;
        
        if (pairStr.startsWith(normalizedBase)) {
          const targetCurrency = pairStr.substring(normalizedBase.length);
          rates[targetCurrency] = rateNum;
        }
      }

      rates[normalizedBase] = 1;

      return {
        success: true,
        base: normalizedBase,
        date: data.date || date,
        rates,
      };
    } catch (error: any) {
      return this.formatResponse(
        false,
        this.normalizeCurrencyCode(baseCurrency),
        null,
        `CurrencyLayer historical API error: ${error.message}`
      );
    }
  }

  /**
   * Convert specific amount between currencies
   */
  public async convertAmount(
    amount: number,
    from: string,
    to: string,
    date?: string
  ): Promise<any> {
    try {
      if (!this.validateCurrencyCode(from) || !this.validateCurrencyCode(to)) {
        throw new Error('Invalid currency codes');
      }

      const normalizedFrom = this.normalizeCurrencyCode(from);
      const normalizedTo = this.normalizeCurrencyCode(to);
      const config = this.config as CurrencyLayerConfig;

      const params: any = {
        access_key: config.apiKey,
        from: normalizedFrom,
        to: normalizedTo,
        amount,
        format: 1,
      };

      if (date) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          throw new Error('Date must be in YYYY-MM-DD format');
        }
        params.date = date;
      }

      const requestConfig = {
        method: 'GET' as const,
        url: '/convert',
        params,
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        throw new Error(data.error?.info || 'Currency conversion failed');
      }

      return {
        success: true,
        query: {
          from: data.query.from,
          to: data.query.to,
          amount: data.query.amount,
        },
        info: {
          timestamp: data.info.timestamp,
          quote: data.info.quote,
        },
        historical: data.historical || false,
        date: data.date || new Date().toISOString().split('T')[0],
        result: data.result,
      };
    } catch (error: any) {
      throw new Error(`Currency conversion error: ${error.message}`);
    }
  }

  /**
   * Get time frame data (Professional plan and above)
   */
  public async getTimeFrame(
    startDate: string,
    endDate: string,
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<any> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('Dates must be in YYYY-MM-DD format');
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      const config = this.config as CurrencyLayerConfig;
      
      const params: any = {
        access_key: config.apiKey,
        start_date: startDate,
        end_date: endDate,
        source: normalizedBase,
        format: 1,
      };

      if (currencies && currencies.length > 0) {
        params.currencies = currencies.join(',');
      }

      const requestConfig = {
        method: 'GET' as const,
        url: '/timeframe',
        params,
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        throw new Error(data.error?.info || 'Failed to fetch timeframe data');
      }

      // Process quotes for each date
      const processedRates: { [date: string]: { [currency: string]: number } } = {};
      
      for (const [date, quotes] of Object.entries(data.quotes || {})) {
        const dateRates: { [currency: string]: number } = {};
        const quotesObj = quotes as { [key: string]: number };
        
        for (const [pair, rate] of Object.entries(quotesObj)) {
          if (pair.startsWith(normalizedBase)) {
            const targetCurrency = pair.substring(normalizedBase.length);
            dateRates[targetCurrency] = rate;
          }
        }
        
        dateRates[normalizedBase] = 1;
        processedRates[date] = dateRates;
      }

      return {
        success: true,
        timeframe: data.timeframe,
        start_date: data.start_date,
        end_date: data.end_date,
        source: data.source,
        quotes: processedRates,
      };
    } catch (error: any) {
      throw new Error(`Timeframe data error: ${error.message}`);
    }
  }

  /**
   * Get currency change data (shows percentage changes)
   */
  public async getCurrencyChange(
    startDate: string,
    endDate: string,
    baseCurrency: string = 'USD',
    currencies?: string[]
  ): Promise<any> {
    try {
      if (!this.validateCurrencyCode(baseCurrency)) {
        throw new Error(`Invalid base currency code: ${baseCurrency}`);
      }

      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('Dates must be in YYYY-MM-DD format');
      }

      const normalizedBase = this.normalizeCurrencyCode(baseCurrency);
      const config = this.config as CurrencyLayerConfig;
      
      const params: any = {
        access_key: config.apiKey,
        start_date: startDate,
        end_date: endDate,
        source: normalizedBase,
        format: 1,
      };

      if (currencies && currencies.length > 0) {
        params.currencies = currencies.join(',');
      }

      const requestConfig = {
        method: 'GET' as const,
        url: '/change',
        params,
      };

      const data = await this.makeRequest(requestConfig);

      if (!data.success) {
        throw new Error(data.error?.info || 'Failed to fetch currency change data');
      }

      return {
        success: true,
        change: data.change,
        start_date: data.start_date,
        end_date: data.end_date,
        source: data.source,
        quotes: data.quotes,
      };
    } catch (error: any) {
      throw new Error(`Currency change data error: ${error.message}`);
    }
  }
}
