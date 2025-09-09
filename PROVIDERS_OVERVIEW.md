# Currency Providers Overview

Complete guide to supported exchange rate providers in @wickedlet/currency-converter v1.0.0

## Available Providers

### 1. 💰 **Open Exchange Rates**
- **API Key Required**: ✅ Yes
- **Cost**: Free tier (1,000 requests/month), paid plans from $12/month
- **Features**:
  - Real-time exchange rates
  - Historical rates (paid plans)
  - Time-series data (Enterprise)
  - Currency conversion (paid plans)
  - Usage statistics
  - 170+ currencies
- **Rate Limits**: 1,000/month (free) to unlimited (Enterprise)
- **Best For**: Professional applications, enterprise

### 2. 💰 **CurrencyLayer**
- **API Key Required**: ✅ Yes
- **Cost**: Free tier (1,000 requests/month), paid plans from $10/month
- **Features**:
  - Real-time exchange rates
  - Historical rates
  - Currency conversion
  - Time frame data
  - Currency change analysis
  - 168+ currencies
- **Rate Limits**: 1,000/month (free) to 1M/month (paid)
- **Best For**: Financial applications, e-commerce

### 3. 💰 **Fixer.io**
- **API Key Required**: ✅ Yes
- **Cost**: Free tier (100 requests/month), paid plans from $10/month
- **Features**:
  - Real-time exchange rates
  - Historical rates
  - Supported currencies list
  - 170+ currencies
- **Rate Limits**: 100/month (free) to 1M/month (paid)
- **Best For**: Established applications, reliable service

## Comparison Matrix

| Provider | Free Tier | API Key | Rate Limit (Free) | Historical Rates | Best Feature |
|----------|-----------|---------|-------------------|------------------|--------------|
| **Open Exchange Rates** | ✅ | ✅ | 1,000/month | ❌ (Paid only) | Enterprise features |
| **CurrencyLayer** | ✅ | ✅ | 1,000/month | ✅ | Financial data focus |
| **Fixer.io** | ✅ | ✅ | 100/month | ✅ | Reliable & established |

## Recommendations by Use Case

### 🏗️ **Development & Testing**
1. **Open Exchange Rates (Free)** - 1,000 requests/month, good for testing
2. **CurrencyLayer (Free)** - 1,000 requests/month, reliable
3. **Fixer.io (Free)** - 100 requests/month, good for basic testing

### 🚀 **Small Production Apps**
1. **Open Exchange Rates (Free)** - 1,000 requests/month
2. **CurrencyLayer (Free)** - 1,000 requests/month
3. **Fixer.io** - Need paid plan for production

### 💼 **Medium Production Apps**
1. **CurrencyLayer** - $10/month, financial focus
2. **Open Exchange Rates** - $12/month, reliable
3. **Fixer.io** - $10/month, established

### 🏢 **Enterprise Applications**
1. **Open Exchange Rates (Enterprise)** - Unlimited, time-series
2. **CurrencyLayer (Professional+)** - High limits, advanced features
3. **Fixer.io (Professional+)** - Established, reliable

### 💰 **Best Free Tier Options**
1. **Open Exchange Rates** - 1,000 free requests/month
2. **CurrencyLayer** - 1,000 free requests/month
3. **Fixer.io** - 100 free requests/month

## Provider-Specific Features

### Open Exchange Rates Unique Features:
- Usage statistics API
- Time-series data (Enterprise)
- Multiple data formats
- Mobile-friendly endpoints

### CurrencyLayer Unique Features:
- Currency change percentages
- Time frame analysis
- Financial market focus
- Bank-grade data

### Fixer.io Unique Features:
- Most established service
- Excellent uptime
- European data focus
- Strong documentation

## Implementation Examples

### Quick Start (Free Tier Options)
```typescript
// Option 1: Open Exchange Rates (1,000 requests/month)
const provider = new OpenExchangeRatesProvider({
  apiKey: process.env.OPEN_EXCHANGE_RATES_API_KEY,
  plan: 'free'
});

// Option 2: CurrencyLayer (1,000 requests/month)
const provider = new CurrencyLayerProvider({
  apiKey: process.env.CURRENCYLAYER_API_KEY,
  useHttps: false // Free plan uses HTTP
});

// Option 3: Fixer.io (100 requests/month)
const provider = new FixerProvider({
  apiKey: process.env.FIXER_API_KEY,
  useHttps: false // Free plan uses HTTP
});
```

### Production Setup (Paid Options)
```typescript
// Option 1: Open Exchange Rates
const provider = new OpenExchangeRatesProvider({
  apiKey: process.env.OPEN_EXCHANGE_RATES_API_KEY,
  plan: 'developer'
});

// Option 2: CurrencyLayer
const provider = new CurrencyLayerProvider({
  apiKey: process.env.CURRENCYLAYER_API_KEY,
  useHttps: true
});
```

### Multi-Provider Redundancy
```typescript
const providers = [
  new FixerProvider({ apiKey: process.env.FIXER_KEY }), // Primary
  new OpenExchangeRatesProvider({ apiKey: process.env.OXR_KEY }), // Secondary
  new CurrencyLayerProvider({ apiKey: process.env.CL_KEY }), // Fallback
];

// Implement fallback logic
for (const provider of providers) {
  try {
    const converter = new CurrencyConverter({ provider });
    const result = await converter.convertCurrency(100, 'USD', 'EUR');
    break; // Success, exit loop
  } catch (error) {
    continue; // Try next provider
  }
}
```

## Performance Considerations

1. **Response Times**: All providers typically respond within 200-500ms
2. **Reliability**: Open Exchange Rates and Fixer.io most reliable
3. **Rate Limits**: Consider your usage patterns and free tier limits
4. **Caching**: Always implement Redis caching to reduce API calls
5. **Fallback**: Use multiple providers for production applications

## Getting Started

1. Start with **Open Exchange Rates** for development (1,000 requests/month)
2. Add **CurrencyLayer** as backup (1,000 requests/month)
3. Use **Fixer.io** for additional redundancy (100 requests/month)
4. Implement caching to optimize performance and costs
5. Set up monitoring for rate limits and errors
