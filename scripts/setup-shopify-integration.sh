#!/bin/bash
# Shopify Integration Setup Script
# Run this to set up the database and environment for Shopify OAuth

set -e

echo "🚀 Aura Platform - Shopify Integration Setup"
echo "============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp .env.example .env 2>/dev/null || touch .env
fi

# Check for required environment variables
echo "📋 Checking environment variables..."

missing_vars=()

if ! grep -q "SHOPIFY_API_KEY" .env; then
    missing_vars+=("SHOPIFY_API_KEY")
fi

if ! grep -q "SHOPIFY_API_SECRET" .env; then
    missing_vars+=("SHOPIFY_API_SECRET")
fi

if ! grep -q "APP_URL" .env; then
    missing_vars+=("APP_URL")
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "⚠️  Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please add these to your .env file:"
    echo "SHOPIFY_API_KEY=your_shopify_api_key"
    echo "SHOPIFY_API_SECRET=your_shopify_api_secret"
    echo "APP_URL=https://your-app-domain.com"
    echo "SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,read_customers,write_customers"
    echo ""
else
    echo "✅ All required environment variables found"
fi

# Run database migration
echo ""
echo "🗄️  Running database migration..."

if command -v psql &> /dev/null; then
    echo "PostgreSQL detected. Running migration..."
    
    # Try to read database URL from .env
    if grep -q "DATABASE_URL" .env; then
        DB_URL=$(grep "DATABASE_URL" .env | cut -d '=' -f2-)
        echo "Using database from DATABASE_URL"
    else
        echo "⚠️  DATABASE_URL not found in .env"
        echo "Please run migration manually:"
        echo "psql -U username -d database_name -f migrations/002_shopify_integration.sql"
    fi
    
    # Uncomment to auto-run migration (requires DATABASE_URL parsing)
    # psql "$DB_URL" -f migrations/002_shopify_integration.sql
    
    echo "Run this command to apply migration:"
    echo "psql \$DATABASE_URL -f migrations/002_shopify_integration.sql"
else
    echo "⚠️  PostgreSQL CLI not found. Please run migration manually."
    echo "psql -U username -d database_name -f migrations/002_shopify_integration.sql"
fi

# Check if Node modules are installed
echo ""
echo "📦 Checking dependencies..."

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
else
    echo "✅ Backend dependencies installed"
fi

if [ ! -d "aura-console/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd aura-console && npm install && cd ..
else
    echo "✅ Frontend dependencies installed"
fi

# Create data directories if they don't exist
echo ""
echo "📁 Creating data directories..."
mkdir -p data
mkdir -p logs
echo "✅ Directories created"

# Summary
echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Configure Shopify App:"
echo "   - Go to https://partners.shopify.com/"
echo "   - Create new app"
echo "   - Set App URL and Redirect URL"
echo "   - Copy API key and secret to .env"
echo ""
echo "2. Run database migration:"
echo "   psql \$DATABASE_URL -f migrations/002_shopify_integration.sql"
echo ""
echo "3. Start the server:"
echo "   npm run dev"
echo ""
echo "4. Test OAuth flow:"
echo "   - Navigate to Settings → Shopify Integration"
echo "   - Click 'Connect to Shopify'"
echo "   - Authorize your test store"
echo ""
echo "Happy building! 🚀"
