# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- **Initial release** of @wickedlet/currency-converter
- **Multiple Exchange Rate Providers**: Support for Fixer.io, Open Exchange Rates, and CurrencyLayer
- **Intelligent Redis Caching**: Advanced bulk exchange rates caching for 99%+ performance improvement
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Provider Architecture**: Abstract base provider class for easy extension and custom providers
- **Batch Operations**: Support for multiple currency conversions in a single call
- **Advanced Cache Management**: Provider-level caching with statistics and manual refresh capabilities
- **Error Handling**: Robust error handling with retry logic and graceful fallbacks
- **Cost Optimization**: Massive API call reduction (~99% fewer calls with intelligent caching)

### Core Features
- **CurrencyConverter**: Main class for all currency conversion operations
- **FixerProvider**: Integration with Fixer.io API (paid service)
- **OpenExchangeRatesProvider**: Integration with Open Exchange Rates API
- **CurrencyLayerProvider**: Integration with CurrencyLayer API
- **ExchangeRatesCache**: Intelligent bulk caching system for exchange rates
- **RedisCacheManager**: Redis-based caching implementation with TTL support
- **BaseCurrencyProvider**: Abstract base class for implementing custom providers

### API Methods
- `convertCurrency(amount, from, to)`: Convert amount between currencies with detailed results
- `getExchangeRates(baseCurrency)`: Get all exchange rates for a base currency
- `getExchangeRate(from, to)`: Get specific exchange rate between two currencies
- `convertMultiple(conversions)`: Batch convert multiple currency pairs efficiently
- `getCacheStats()`: Get comprehensive cache statistics across all providers
- `isProviderRatesCached(baseCurrency)`: Check if rates are cached for current provider
- `refreshProviderRates(baseCurrency)`: Force refresh rates with cache invalidation
- `clearCache()` / `clearProviderCache()` / `clearAllRatesCache()`: Various cache clearing options

### Performance Features
- **Intelligent Caching**: Cache entire exchange rate sets per provider (1 API call = 172+ rates)
- **Provider-level Isolation**: Separate caches per provider to avoid conflicts
- **Cache Statistics**: Rich monitoring and management capabilities
- **Response Time**: 0-1ms for cached conversions vs 600ms for fresh API calls
- **API Efficiency**: 99% reduction in API usage for subsequent calls

### Documentation & Examples
- Comprehensive README with quick start guides
- Provider comparison and recommendations
- Basic usage examples without caching
- Advanced Redis caching integration examples
- Multiple provider setup and fallback strategies
- Custom provider implementation guide
- Batch conversion and performance optimization examples

### Supported Currencies
- 170+ currencies supported across all providers
- Real-time exchange rates with configurable cache TTL
- Historical rates support (provider dependent)
- Currency validation and normalization
