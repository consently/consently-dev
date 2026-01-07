#!/usr/bin/env node

/**
 * Build script for Consently Widgets
 * Minifies both widget.js and dpdpa-widget.js and creates production-ready versions
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const cdnDir = path.join(publicDir, 'cdn');

// Widget files to process
const widgets = [
  { source: 'widget.js', name: 'Cookie Widget' },
  { source: 'dpdpa-widget.js', name: 'DPDPA Widget' }
];

console.log('🚀 Building Consently Widgets...\n');

// Ensure CDN directory exists
if (!fs.existsSync(cdnDir)) {
  fs.mkdirSync(cdnDir, { recursive: true });
}

// Process each widget
widgets.forEach(({ source, name }) => {
  console.log(`\n📦 Processing ${name}...`);
  
  const sourceFile = path.join(publicDir, source);
  const minifiedFile = path.join(publicDir, source.replace('.js', '.min.js'));
  const productionFile = path.join(cdnDir, source);

  // Read the source file
  console.log('   📖 Reading source file:', sourceFile);
  const sourceCode = fs.readFileSync(sourceFile, 'utf8');

  // Basic minification (remove comments and unnecessary whitespace)
  console.log('   ⚙️  Minifying code...');
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
  console.log('   💾 Writing minified file:', minifiedFile);
  fs.writeFileSync(minifiedFile, minified, 'utf8');

  // Copy to CDN location
  fs.copyFileSync(minifiedFile, productionFile);
  console.log('   📁 Production file created:', productionFile);

  // Calculate file sizes
  const originalSize = Buffer.byteLength(sourceCode, 'utf8');
  const minifiedSize = Buffer.byteLength(minified, 'utf8');
  const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);

  console.log(`   📊 Size: ${(originalSize / 1024).toFixed(2)} KB → ${(minifiedSize / 1024).toFixed(2)} KB (${savings}% saved)`);
});

// Create a gzipped version for size comparison
const { gzipSync } = require('zlib');

// Generate integrity hashes and version info
const versionInfo = {
  version: '3.0.0',
  buildDate: new Date().toISOString(),
  widgets: []
};

widgets.forEach(({ source, name }) => {
  const productionFile = path.join(cdnDir, source);
  const minifiedCode = fs.readFileSync(productionFile, 'utf8');
  const gzipped = gzipSync(minifiedCode);
  
  // Generate integrity hash
  const crypto = require('crypto');
  const hash = crypto.createHash('sha384');
  hash.update(minifiedCode);
  const integrity = 'sha384-' + hash.digest('base64');

  versionInfo.widgets.push({
    name,
    file: source,
    fileSize: minifiedCode.length,
    gzippedSize: gzipped.length,
    integrity
  });

  console.log(`\n🔒 ${name} SRI Hash:`);
  console.log(`   ${integrity}`);
  console.log(`   📦 Gzipped: ${(gzipped.length / 1024).toFixed(2)} KB`);
});

// Save version info
const versionFile = path.join(cdnDir, 'version.json');
fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2), 'utf8');
console.log('\n📝 Version info saved:', versionFile);

console.log('\n✅ All widgets built successfully!\n');
console.log('Next steps:');
console.log('  1. Test the widgets locally using the test HTML files');
console.log('  2. Deploy the /cdn directory to your CDN or server');
console.log('  3. Use the integrity hashes for secure loading (optional)\n');
