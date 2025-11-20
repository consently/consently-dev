#!/bin/bash

# Script to verify environment setup for Consently
# Run: ./scripts/verify-env-setup.sh

echo "🔍 Verifying Consently Environment Setup"
echo "========================================"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "   Create it by copying .env.local.example (if it exists)"
    exit 1
fi

echo "✓ .env.local file found"
echo ""

# Load .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check required environment variables
echo "📋 Checking required environment variables:"
echo ""

check_var() {
    VAR_NAME=$1
    VAR_VALUE=${!VAR_NAME}
    
    if [ -z "$VAR_VALUE" ]; then
        echo "  ❌ $VAR_NAME: NOT SET"
        return 1
    else
        # Show first 20 chars and length
        VAR_LENGTH=${#VAR_VALUE}
        VAR_PREVIEW="${VAR_VALUE:0:20}"
        echo "  ✓ $VAR_NAME: SET (length: $VAR_LENGTH, starts with: $VAR_PREVIEW...)"
        return 0
    fi
}

MISSING_COUNT=0

check_var "NEXT_PUBLIC_SUPABASE_URL" || ((MISSING_COUNT++))
check_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" || ((MISSING_COUNT++))
check_var "SUPABASE_SERVICE_ROLE_KEY" || ((MISSING_COUNT++))

echo ""

if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ All required environment variables are set!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Make sure the database migration 29 is applied"
    echo "   2. Restart your development server: npm run dev"
    echo "   3. Test the preference centre functionality"
else
    echo "❌ $MISSING_COUNT environment variable(s) missing"
    echo ""
    echo "📝 To fix:"
    echo "   1. Go to your Supabase project dashboard"
    echo "   2. Navigate to Settings → API"
    echo "   3. Copy the missing keys and add them to .env.local"
    echo ""
    echo "   Missing SUPABASE_SERVICE_ROLE_KEY?"
    echo "   → Copy the 'service_role' key from Supabase Dashboard"
    echo "   → Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here"
    exit 1
fi

