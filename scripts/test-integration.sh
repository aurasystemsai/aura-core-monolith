#!/bin/bash
# Test Script - Verify Shopify Integration & Billing Setup
# Run this after completing setup to verify everything works

set -e

echo "🧪 Aura Platform - Integration Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0

# Helper functions
test_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠ WARN${NC}: $1"
}

# Check environment variables
echo "📋 Checking Environment Variables..."
echo "-----------------------------------"

check_env_var() {
    if grep -q "^$1=" .env 2>/dev/null && ! grep -q "^$1=.*your_.*" .env; then
        test_pass "$1 is set"
        return 0
    else
        test_fail "$1 is missing or has placeholder value"
        return 1
    fi
}

if [ ! -f .env ]; then
    test_fail ".env file not found. Copy from .env.example"
else
    test_pass ".env file exists"
fi

check_env_var "SHOPIFY_API_KEY"
check_env_var "SHOPIFY_API_SECRET"
check_env_var "APP_URL"
check_env_var "DATABASE_URL"
check_env_var "SESSION_SECRET"
check_env_var "OPENAI_API_KEY"

# Check Stripe (optional but recommended)
if grep -q "^STRIPE_SECRET_KEY=" .env 2>/dev/null && ! grep -q "^STRIPE_SECRET_KEY=sk_test_your" .env; then
    test_pass "STRIPE_SECRET_KEY is set"
else
    test_warn "STRIPE_SECRET_KEY not set (billing features won't work)"
fi

echo ""

# Check database connectivity
echo "🗄️  Testing Database Connection..."
echo "-----------------------------------"

if command -v psql &> /dev/null; then
    if psql $DATABASE_URL -c "SELECT 1" &> /dev/null 2>&1; then
        test_pass "Database connection successful"
        
        # Check if migrations ran
        if psql $DATABASE_URL -c "\dt shopify_stores" &> /dev/null 2>&1; then
            test_pass "Shopify integration tables exist"
        else
            test_fail "Shopify integration tables missing. Run: psql \$DATABASE_URL -f migrations/002_shopify_integration.sql"
        fi
    else
        test_fail "Database connection failed. Check DATABASE_URL"
    fi
else
    test_warn "psql not found. Skipping database tests."
fi

echo ""

# Check if server is running
echo "🚀 Testing Server..."
echo "-----------------------------------"

if curl -s -o /dev/null -w "%{http_code}" http://localhost:10000 | grep -q "200\|302\|404"; then
    test_pass "Server is running on port 10000"
    
    # Test OAuth endpoint exists
    if curl -s http://localhost:10000/shopify/auth 2>&1 | grep -q "Missing shop parameter\|redirect"; then
        test_pass "Shopify OAuth endpoint (/shopify/auth) is accessible"
    else
        test_fail "Shopify OAuth endpoint not responding correctly"
    fi
    
    # Test billing endpoint exists
    if curl -s http://localhost:10000/api/billing/subscription 2>&1 | grep -q "subscription\|authenticated\|error"; then
        test_pass "Billing API endpoint (/api/billing/subscription) is accessible"
    else
        test_fail "Billing API endpoint not responding"
    fi
else
    test_fail "Server is not running. Start with: npm run dev"
fi

echo ""

# Check frontend build
echo "🎨 Testing Frontend..."
echo "-----------------------------------"

if [ -d "aura-console/node_modules" ]; then
    test_pass "Frontend dependencies installed"
else
    test_fail "Frontend dependencies missing. Run: cd aura-console && npm install"
fi

if [ -f "aura-console/src/components/Settings.jsx" ]; then
    test_pass "Settings component exists"
else
    test_fail "Settings component missing"
fi

if [ -f "aura-console/src/components/Billing.jsx" ]; then
    test_pass "Billing component exists"
else
    test_fail "Billing component missing"
fi

if [ -f "aura-console/src/components/OnboardingWizard.jsx" ]; then
    test_pass "OnboardingWizard component exists"
else
    test_fail "OnboardingWizard component missing"
fi

echo ""

# Check migration files
echo "📦 Checking Migration Files..."
echo "-----------------------------------"

if [ -f "migrations/002_shopify_integration.sql" ]; then
    test_pass "Shopify integration migration exists"
else
    test_fail "Shopify integration migration missing"
fi

echo ""

# Check Shopify app configuration
echo "🛍️  Shopify App Configuration..."
echo "-----------------------------------"

APP_URL=$(grep '^APP_URL=' .env 2>/dev/null | cut -d '=' -f2)
if [ -n "$APP_URL" ]; then
    echo "Remember to configure in Shopify Partner Dashboard:"
    echo "  • App URL: $APP_URL"
    echo "  • Redirect URL: $APP_URL/shopify/callback"
    echo ""
fi

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! You're ready to go.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start the server (if not running): npm run dev"
    echo "2. Navigate to: http://localhost:10000"
    echo "3. Go to Settings → Shopify Integration"
    echo "4. Test OAuth connection"
    echo "5. Go to Billing → Test plan selection"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "• Missing .env variables: Copy from .env.example and fill in values"
    echo "• Database not running: Start PostgreSQL"
    echo "• Migrations not run: psql \$DATABASE_URL -f migrations/002_shopify_integration.sql"
    echo "• Server not running: npm run dev"
    exit 1
fi
