#!/usr/bin/env node

/**
 * Build script for Consently Widget
 * Minifies widget.js and creates a production-ready version
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sourceFile = path.join(publicDir, 'widget.js');
const minifiedFile = path.join(publicDir, 'widget.min.js');

console.log('🚀 Building Consently Widget...\n');

// Read the source file
console.log('📖 Reading source file:', sourceFile);
const sourceCode = fs.readFileSync(sourceFile, 'utf8');

// Basic minification (remove comments and unnecessary whitespace)
console.log('⚙️  Minifying code...');

let minified = sourceCode
  // Remove multi-line comments
  .replace(/\/\*[\s\S]*?\*\//g, '')
  // Remove single-line comments (but keep URLs)
  .replace(/([^:]|^)\/\/.*$/gm, '$1')
  // Remove extra whitespace
  .replace(/\s+/g, ' ')
  // Remove whitespace around operators and punctuation
  .replace(/\s*([{}();,:])\s*/g, '$1')
  // Remove whitespace after keywords
  .replace(/\s*(return|var|let|const|if|else|function|for|while|do|switch|case|break|continue|throw|try|catch|finally)\s+/g, '$1 ')
  .trim();

// Write the minified file
console.log('💾 Writing minified file:', minifiedFile);
fs.writeFileSync(minifiedFile, minified, 'utf8');

// Calculate file sizes
const originalSize = Buffer.byteLength(sourceCode, 'utf8');
const minifiedSize = Buffer.byteLength(minified, 'utf8');
const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);

console.log('\n✅ Build complete!\n');
console.log('📊 File Size Comparison:');
console.log(`   Original:  ${(originalSize / 1024).toFixed(2)} KB`);
console.log(`   Minified:  ${(minifiedSize / 1024).toFixed(2)} KB`);
console.log(`   Savings:   ${savings}%\n`);

// Create a gzipped version for size comparison
const { gzipSync } = require('zlib');
const gzipped = gzipSync(minified);
const gzippedSize = gzipped.length;

console.log('📦 Gzipped size: ' + (gzippedSize / 1024).toFixed(2) + ' KB');
console.log('   (This is what will be transferred over the network)\n');

// Copy to production location if it exists
const productionDir = path.join(publicDir, 'cdn');
if (!fs.existsSync(productionDir)) {
  fs.mkdirSync(productionDir, { recursive: true });
}

const productionFile = path.join(productionDir, 'widget.js');
fs.copyFileSync(minifiedFile, productionFile);
console.log('📁 Production file created:', productionFile);

// Generate integrity hash for SRI (Subresource Integrity)
const crypto = require('crypto');
const hash = crypto.createHash('sha384');
hash.update(minified);
const integrity = 'sha384-' + hash.digest('base64');

console.log('\n🔒 Subresource Integrity (SRI) Hash:');
console.log(`   ${integrity}\n`);

// Create a version info file
const versionInfo = {
  version: '3.0.0',
  buildDate: new Date().toISOString(),
  fileSize: minifiedSize,
  gzippedSize: gzippedSize,
  integrity: integrity
};

const versionFile = path.join(productionDir, 'version.json');
fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2), 'utf8');
console.log('📝 Version info saved:', versionFile);

console.log('\n🎉 All done! Your widget is ready for production.\n');
console.log('Next steps:');
console.log('  1. Test the widget locally using test-widget.html');
console.log('  2. Deploy the widget.js file to your CDN or server');
console.log('  3. Use the integrity hash for secure loading (optional)\n');
