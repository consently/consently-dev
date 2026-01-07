#!/bin/bash

# Pre-deployment script to ensure widgets are built and ready
echo "🚀 Preparing for deployment..."

# Build widgets
echo "📦 Building widgets..."
npm run build:widget

# Check if widgets are built
if [ ! -f "public/cdn/dpdpa-widget.js" ]; then
    echo "❌ DPDPA widget not found in /public/cdn/"
    exit 1
fi

if [ ! -f "public/cdn/widget.js" ]; then
    echo "❌ Cookie widget not found in /public/cdn/"
    exit 1
fi

echo "✅ Widgets are ready for deployment"
echo "📋 Widget files:"
echo "   - public/cdn/dpdpa-widget.js ($(stat -f%z public/cdn/dpdpa-widget.js 2>/dev/null || stat -c%s public/cdn/dpdpa-widget.js) bytes)"
echo "   - public/cdn/widget.js ($(stat -f%z public/cdn/widget.js 2>/dev/null || stat -c%s public/cdn/widget.js) bytes)"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod
