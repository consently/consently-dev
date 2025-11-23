#!/usr/bin/env node

/**
 * Cookie Scanner Test Script
 * Tests the cookie scanning functionality with various scenarios
 */

const { CookieScanner } = require('../lib/cookies/cookie-scanner.ts');

async function testCookieScanner() {
  console.log('🧪 Testing Cookie Scanner Functionality');
  console.log('=====================================\n');

  const testCases = [
    {
      name: 'Google.com (should have real cookies)',
      url: 'https://google.com',
      scanDepth: 'shallow'
    },
    {
      name: 'GitHub.com (should have real cookies)',
      url: 'https://github.com',
      scanDepth: 'shallow'
    },
    {
      name: 'Example.com (minimal cookies)',
      url: 'https://example.com',
      scanDepth: 'shallow'
    }
  ];

  const testUserId = 'test-user-' + Date.now();

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    console.log(`Scan Depth: ${testCase.scanDepth}`);
    console.log('----------------------------------------');

    try {
      const startTime = Date.now();
      
      const result = await CookieScanner.scanWebsite({
        url: testCase.url,
        scanDepth: testCase.scanDepth,
        userId: testUserId
      });

      const duration = Date.now() - startTime;

      console.log(`✅ Scan completed in ${duration}ms`);
      console.log(`📊 Results:`);
      console.log(`   - Scan ID: ${result.scanId}`);
      console.log(`   - Cookies found: ${result.cookies.length}`);
      console.log(`   - Pages scanned: ${result.summary.pages_scanned}`);
      console.log(`   - Compliance score: ${result.summary.compliance_score}`);
      console.log(`   - Third-party cookies: ${result.summary.third_party_count}`);
      console.log(`   - First-party cookies: ${result.summary.first_party_count}`);

      if (result.cookies.length > 0) {
        console.log(`\n📋 Sample cookies found:`);
        result.cookies.slice(0, 3).forEach((cookie, index) => {
          console.log(`   ${index + 1}. ${cookie.name} (${cookie.domain})`);
          console.log(`      Category: ${cookie.category}`);
          console.log(`      Provider: ${cookie.provider}`);
          console.log(`      Third-party: ${cookie.is_third_party ? 'Yes' : 'No'}`);
          console.log(`      Expiry: ${cookie.expiry}`);
        });
        
        if (result.cookies.length > 3) {
          console.log(`   ... and ${result.cookies.length - 3} more cookies`);
        }
      } else {
        console.log(`⚠️  No cookies found - this may indicate an issue with cookie detection`);
      }

      console.log(`\n🏷️  Cookie categories:`);
      Object.entries(result.summary.classification).forEach(([category, count]) => {
        console.log(`   - ${category}: ${count} cookies`);
      });

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      if (error.stack) {
        console.error(`Stack trace: ${error.stack}`);
      }
    }
  }

  console.log('\n🎯 Testing Different Scan Depths');
  console.log('=================================\n');

  const depthTest = {
    url: 'https://vercel.com',
    depths: ['shallow', 'medium', 'deep']
  };

  for (const depth of depthTest.depths) {
    console.log(`\n🔍 Testing ${depth} scan on ${depthTest.url}`);
    console.log('----------------------------------------');

    try {
      const startTime = Date.now();
      
      const result = await CookieScanner.scanWebsite({
        url: depthTest.url,
        scanDepth: depth,
        userId: testUserId
      });

      const duration = Date.now() - startTime;

      console.log(`✅ ${depth} scan completed in ${duration}ms`);
      console.log(`   - Pages scanned: ${result.summary.pages_scanned}`);
      console.log(`   - Cookies found: ${result.cookies.length}`);
      console.log(`   - Compliance score: ${result.summary.compliance_score}`);

    } catch (error) {
      console.error(`❌ ${depth} scan failed: ${error.message}`);
    }
  }

  console.log('\n✨ Cookie Scanner Tests Completed');
  console.log('=====================================');
}

// Environment check
function checkEnvironment() {
  console.log('🔧 Environment Check');
  console.log('====================');
  
  const requiredVars = [
    'BROWSERLESS_API_KEY',
    'BROWSERLESS_URL'
  ];

  const warnings = [];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName === 'BROWSERLESS_API_KEY' ? '***hidden***' : value}`);
    } else {
      console.log(`⚠️  ${varName}: Not set (will use fallback scanner)`);
      warnings.push(varName);
    }
  });

  if (warnings.length > 0) {
    console.log('\n💡 Note: Some environment variables are missing.');
    console.log('   The scanner will fall back to HTTP-only scanning.');
    console.log('   For full functionality, please set:');
    warnings.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }

  console.log('');
}

// Run tests
async function main() {
  try {
    checkEnvironment();
    await testCookieScanner();
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { testCookieScanner };