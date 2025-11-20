#!/bin/bash

# Email Verification Setup Script
# This script helps you set up email verification for the preference centre

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}║       Email Verification Setup Wizard                  ║${NC}"
echo -e "${BLUE}║                                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print success message
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning message
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info message
info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Step 1: Check Node.js version
echo -e "${BLUE}Step 1: Checking Node.js version...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js is installed: $NODE_VERSION"
else
    error "Node.js is not installed!"
    info "Please install Node.js from https://nodejs.org"
    exit 1
fi
echo ""

# Step 2: Check if Resend is installed
echo -e "${BLUE}Step 2: Checking dependencies...${NC}"
if grep -q '"resend"' package.json; then
    success "Resend package is listed in package.json"
else
    warning "Resend package not found in package.json"
    info "Installing resend package..."
    npm install resend
    success "Resend installed"
fi
echo ""

# Step 3: Check environment file
echo -e "${BLUE}Step 3: Checking environment variables...${NC}"
if [ -f ".env.local" ]; then
    success ".env.local file exists"
    
    # Check for required variables
    if grep -q "RESEND_API_KEY" .env.local; then
        success "RESEND_API_KEY is set"
    else
        warning "RESEND_API_KEY not found in .env.local"
        echo ""
        info "You need a Resend API key. Get one from:"
        echo "   https://resend.com/api-keys"
        echo ""
        read -p "Enter your Resend API key (or press Enter to skip): " RESEND_KEY
        if [ -n "$RESEND_KEY" ]; then
            echo "" >> .env.local
            echo "# Resend Email Service" >> .env.local
            echo "RESEND_API_KEY=$RESEND_KEY" >> .env.local
            success "RESEND_API_KEY added to .env.local"
        fi
    fi
    
    if grep -q "RESEND_FROM_EMAIL" .env.local; then
        success "RESEND_FROM_EMAIL is set"
    else
        warning "RESEND_FROM_EMAIL not found in .env.local"
        echo "" >> .env.local
        echo 'RESEND_FROM_EMAIL="Consently <onboarding@resend.dev>"' >> .env.local
        success "RESEND_FROM_EMAIL added to .env.local (using test address)"
    fi
else
    warning ".env.local file not found"
    info "Creating .env.local from .env.example..."
    
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        success "Created .env.local"
    else
        error ".env.example not found"
        info "Please create .env.local manually with these variables:"
        echo "   NEXT_PUBLIC_SUPABASE_URL=your_url"
        echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key"
        echo "   RESEND_API_KEY=your_resend_key"
        echo "   RESEND_FROM_EMAIL=\"Consently <onboarding@resend.dev>\""
        exit 1
    fi
fi
echo ""

# Step 4: Check database migration
echo -e "${BLUE}Step 4: Checking database migration...${NC}"
if [ -f "supabase/migrations/20250119000001_create_email_verification_otp.sql" ]; then
    success "Migration file exists"
    info "Make sure to run this migration on your database:"
    echo "   Option 1: supabase db push"
    echo "   Option 2: Copy SQL to Supabase Dashboard → SQL Editor"
else
    error "Migration file not found!"
    exit 1
fi
echo ""

# Step 5: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Setup Complete!                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

success "Email verification setup is ready!"
echo ""
info "Next steps:"
echo "   1. Make sure your database migration is applied"
echo "   2. Get a Resend API key from https://resend.com/api-keys"
echo "   3. Add RESEND_API_KEY to your .env.local file"
echo "   4. Restart your dev server: npm run dev"
echo "   5. Test the feature: npx tsx scripts/test-email-verification.ts"
echo ""
info "Documentation:"
echo "   Setup Guide: docs/setup/EMAIL_VERIFICATION_SETUP.md"
echo "   Troubleshooting: docs/fixes/EMAIL_VERIFICATION_TROUBLESHOOTING.md"
echo ""

