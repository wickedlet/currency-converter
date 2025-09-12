#!/bin/bash

# =============================================================================
# QUICK TEST SCRIPT - Kiểm tra nhanh trước khi publish
# =============================================================================

echo "🚀 Quick Test Script"
echo "===================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Build project
print_step "Building project..."
if npm run build; then
    print_success "Build successful"
else
    print_error "Build failed"
    exit 1
fi

# 2. Run unit tests
print_step "Running unit tests..."
if npm test; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    exit 1
fi

# 3. TypeScript check
print_step "Checking TypeScript..."
if npx tsc --noEmit; then
    print_success "TypeScript check passed"
else
    print_error "TypeScript errors found"
    exit 1
fi

# 4. Basic import test
print_step "Testing basic imports..."
cat > temp-import-test.js << 'EOF'
try {
    const { CurrencyConverter } = require('./dist/index.js');
    const { CurrencyLayerProvider, FixerProvider, OpenExchangeRatesProvider } = require('./dist/providers');
    
    // Test provider initialization without API keys (should work)
    try {
        new CurrencyLayerProvider({ apiKey: 'test' });
        new FixerProvider({ apiKey: 'test' });
        new OpenExchangeRatesProvider({ apiKey: 'test' });
        console.log('✅ All providers can be initialized');
    } catch (error) {
        console.error('❌ Provider initialization failed:', error.message);
        process.exit(1);
    }
    
    // Test custom config
    try {
        const provider = new CurrencyLayerProvider({
            apiKey: 'test',
            baseUrl: 'https://custom.example.com',
            defaultParams: { format: 1 },
            timeout: 10000
        });
        console.log('✅ Custom configuration works');
    } catch (error) {
        console.error('❌ Custom config failed:', error.message);
        process.exit(1);
    }
    
    console.log('✅ All basic tests passed');
} catch (error) {
    console.error('❌ Import test failed:', error.message);
    process.exit(1);
}
EOF

if node temp-import-test.js; then
    print_success "Import test passed"
else
    print_error "Import test failed"
    rm -f temp-import-test.js
    exit 1
fi

rm -f temp-import-test.js

echo ""
echo "========================================"
echo -e "${GREEN}🎉 Quick test completed successfully!${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Test with real API keys using: node test-manual.js"
echo "2. Update API keys in test-manual.js file"
echo "3. Run manual test to verify API integration"
echo "4. If everything works: npm publish"
echo ""
