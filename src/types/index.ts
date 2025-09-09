export interface ExchangeRates {
  [currencyCode: string]: number;
}

export interface ExchangeRateResponse {
  success: boolean;
  base: string;
  date: string;
  rates: ExchangeRates;
  error?: string;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  [key: string]: any;
}

export interface CacheConfig {
  ttl?: number; // Time to live in seconds, default 24 hours (86400)
  keyPrefix?: string; // Redis key prefix, default 'currency_rate'
}

export interface CurrencyConverterConfig {
  provider: ICurrencyProvider;
  cache?: {
    client: any; // Redis client
    config?: CacheConfig;
  };
}

export interface ConversionResult {
  amount: number;
  from: string;
  to: string;
  convertedAmount: number;
  rate: number;
  timestamp: string;
  cached: boolean;
}

export interface ICurrencyProvider {
  name: string;
  getExchangeRates(baseCurrency?: string): Promise<ExchangeRateResponse>;
  isConfigValid(): boolean;
}

export interface CacheManager {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  clear?(pattern?: string): Promise<void>;
}
