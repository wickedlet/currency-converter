# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2024-01-15

### Added
- **ExchangeRatesCache**: New intelligent caching system for bulk exchange rates
- **Provider-level caching**: Cache entire exchange rate sets per provider per base currency
- **Cache statistics**: Rich cache monitoring and management features
- **Force refresh methods**: Manual cache invalidation and refresh capabilities
- **Multi-provider cache support**: Separate caches per provider to avoid conflicts

### Changed
- **Caching Strategy**: From individual conversion caching to bulk exchange rates caching
- **Performance**: 99%+ improvement for cached conversions (0-1ms vs 600ms)
- **API Efficiency**: ~99% reduction in API calls (1 call caches 172 rates)
- **Cache Keys**: New pattern `exchange_rates:{provider}:{baseCurrency}`
- **Provider Architecture**: Split `getExchangeRates()` into cached public method and `getExchangeRatesFromAPI()` implementation

### Enhanced
- **BaseCurrencyProvider**: Added cache integration methods
- **CurrencyConverter**: New cache management methods and statistics
- **Redis Integration**: Smarter cache population and retrieval
- **Cost Optimization**: Massive reduction in paid API usage
- **Cache TTL**: Configurable per-provider cache expiration (default: 1 hour)

### Fixed
- **TypeScript**: Resolved abstract method conflicts in base provider
- **Error Handling**: Better cache error handling without breaking main flow
- **Cache Consistency**: Proper cache validation and cleanup

## [1.2.0] - 2024-01-15

### Removed
- **ExchangeRateApiProvider**: Removed ExchangeRate-API integration
- **ExchangeRateHostProvider**: Removed Exchangerate.host integration  
- Cleaned up unused provider references in documentation and examples

### Changed
- Streamlined to 3 core providers: Fixer.io, Open Exchange Rates, CurrencyLayer
- Updated documentation to reflect current provider availability
- Simplified provider switching and fallback logic
- Updated examples to use only available providers

### Fixed
- Fixed TypeScript compilation issues related to removed providers
- Updated test commands to only test available providers
- Corrected provider overview documentation

## [1.1.0] - 2024-01-15

### Added
- **OpenExchangeRatesProvider**: Integration with Open Exchange Rates API
- **CurrencyLayerProvider**: Integration with CurrencyLayer API  
- **ExchangeRateHostProvider**: Integration with Exchangerate.host (completely free)
- Advanced features: time series data, fluctuation analysis, VAT rates
- Provider-specific methods for historical rates, currency conversion, usage statistics
- Multi-provider redundancy examples
- Performance benchmarking examples
- Comprehensive provider comparison documentation

### Enhanced
- Extended provider examples with all 5 providers
- Advanced features demonstration
- Currency validation and information retrieval
- Better error handling across all providers
- Provider switching capabilities

## [1.0.0] - 2024-01-15

### Added
- Initial release of @wickedlet/currency-converter
- Support for multiple exchange rate providers (Fixer.io, ExchangeRate-API)
- Redis caching with configurable TTL
- TypeScript support with comprehensive type definitions
- Abstract base provider class for easy extension
- Batch currency conversion support
- Error handling and retry logic
- Comprehensive documentation and examples
- Support for historical exchange rates (provider dependent)
- Currency validation and normalization
- Performance optimizations with caching

### Features
- **CurrencyConverter**: Main class for currency conversion operations
- **FixerProvider**: Integration with Fixer.io API
- **ExchangeRateApiProvider**: Integration with ExchangeRate-API (free and pro tiers)
- **RedisCacheManager**: Redis-based caching implementation
- **BaseCurrencyProvider**: Abstract base class for custom providers

### API Methods
- `convertCurrency(amount, from, to)`: Convert amount between currencies
- `getExchangeRates(baseCurrency)`: Get all exchange rates for a base currency
- `getExchangeRate(from, to)`: Get specific exchange rate between two currencies
- `convertMultiple(conversions)`: Batch convert multiple currency pairs
- `clearCache(baseCurrency?)`: Clear cached exchange rates
- `isCached(baseCurrency)`: Check if rates are cached
- `getCacheTTL(baseCurrency)`: Get cache TTL for rates

### Examples
- Basic usage without caching
- Redis caching integration
- Multiple providers comparison
- Batch conversion operations
- Custom provider implementation
- Error handling patterns
