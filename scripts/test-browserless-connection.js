#!/usr/bin/env node

/**
 * Browserless Connection Diagnostic Script
 * Tests the Browserless.io connection and provides detailed diagnostics
 */

async function testBrowserlessConnection() {
  console.log('🔍 Browserless Connection Diagnostic Tool');
  console.log('==========================================\n');

  // Check environment variables
  const browserlessUrl = process.env.BROWSERLESS_URL || 'https://production-sfo.browserless.io';
  const apiKey = process.env.BROWSERLESS_API_KEY;

  console.log('📋 Configuration:');
  console.log(`   BROWSERLESS_URL: ${browserlessUrl}`);
  console.log(`   BROWSERLESS_API_KEY: ${apiKey ? '✓ Set (***' + apiKey.slice(-4) + ')' : '✗ Not set'}\n`);

  if (!apiKey) {
    console.error('❌ BROWSERLESS_API_KEY is not set!');
    console.error('   Please set it in your .env.local file:\n');
    console.error('   BROWSERLESS_API_KEY=your_api_key_here\n');
    return false;
  }

  // Test 1: Basic HTTP connectivity
  console.log('🧪 Test 1: HTTP Connectivity');
  console.log('------------------------------');
  try {
    const response = await fetch(`${browserlessUrl}/json/version?token=${apiKey}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✓ HTTP connection successful');
      console.log(`  Browser Version: ${data['Browser'] || 'Unknown'}`);
      console.log(`  Protocol Version: ${data['Protocol-Version'] || 'Unknown'}\n`);
    } else {
      console.error(`✗ HTTP connection failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`  Response: ${errorText}\n`);
      
      if (response.status === 401 || response.status === 403) {
        console.error('  💡 This looks like an authentication error.');
        console.error('     Check that your BROWSERLESS_API_KEY is correct.\n');
      } else if (response.status === 402) {
        console.error('  💡 Quota exceeded - check your Browserless subscription.\n');
      }
      return false;
    }
  } catch (error) {
    console.error('✗ HTTP connection failed:', error.message);
    console.error('  💡 Check your network connection and firewall settings.\n');
    return false;
  }

  // Test 2: WebSocket connectivity
  console.log('🧪 Test 2: WebSocket Connectivity (Playwright)');
  console.log('-----------------------------------------------');
  try {
    // Dynamic import to avoid SSR issues
    const { chromium } = await import('playwright-core');
    
    const wsUrl = browserlessUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const wsEndpoint = `${wsUrl}/chromium/playwright?token=${apiKey}&stealth=true`;
    
    console.log(`  Connecting to: ${wsUrl}/chromium/playwright...`);
    
    const browser = await chromium.connect(wsEndpoint, {
      timeout: 30000
    });
    
    console.log('✓ WebSocket connection successful');
    
    // Test creating a context and page
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    });
    console.log('✓ Browser context created');
    
    const page = await context.newPage();
    console.log('✓ Page created');
    
    // Test navigation
    console.log('  Testing navigation to example.com...');
    await page.goto('https://example.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('✓ Navigation successful');
    
    // Test cookie detection
    const cookies = await context.cookies();
    console.log(`✓ Cookie detection working (found ${cookies.length} cookies)`);
    
    // Cleanup
    await browser.close();
    console.log('✓ Browser closed successfully\n');
    
  } catch (error) {
    console.error('✗ WebSocket connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.error('  💡 Cannot resolve hostname - check BROWSERLESS_URL is correct.\n');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('  💡 Connection timeout - check firewall/network settings.\n');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.error('  💡 Authentication failed - check your API key.\n');
    } else if (error.message.includes('Target page, context or browser has been closed')) {
      console.error('  💡 Browser closed unexpectedly - this could be due to:');
      console.error('     1. Timeout on Browserless server');
      console.error('     2. Quota/memory limits');
      console.error('     3. Network instability\n');
    } else {
      console.error('  💡 Unexpected error - see message above.\n');
    }
    
    return false;
  }

  // Test 3: REST API (/content endpoint)
  console.log('🧪 Test 3: REST API (/content endpoint)');
  console.log('----------------------------------------');
  try {
    const requestUrl = `${browserlessUrl}/content?token=${apiKey}`;
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: 30000
        },
        waitFor: 1000,
        cookies: true,
        html: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`✗ REST API failed: ${response.status} ${response.statusText}`);
      console.error(`  Response: ${errorText}\n`);
      return false;
    }

    const result = await response.json();
    const cookies = result.cookies || [];
    
    console.log('✓ REST API working');
    console.log(`✓ Cookie detection via REST API (found ${cookies.length} cookies)\n`);
    
  } catch (error) {
    console.error('✗ REST API failed:', error.message);
    console.error('  💡 REST API might not be available or network issue.\n');
    return false;
  }

  // All tests passed
  console.log('✅ All tests passed!');
  console.log('   Your Browserless connection is working correctly.');
  console.log('   The cookie scanner should work as expected.\n');
  
  return true;
}

// Test with a real website
async function testRealWebsiteScan() {
  console.log('🧪 Test 4: Real Website Cookie Scan');
  console.log('------------------------------------');
  console.log('   Testing cookie detection on amazon.in...\n');

  try {
    const { chromium } = await import('playwright-core');
    
    const browserlessUrl = process.env.BROWSERLESS_URL || 'https://production-sfo.browserless.io';
    const apiKey = process.env.BROWSERLESS_API_KEY;
    
    const wsUrl = browserlessUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    const wsEndpoint = `${wsUrl}/chromium/playwright?token=${apiKey}&stealth=true&blockAds=false`;
    
    const browser = await chromium.connect(wsEndpoint, { timeout: 60000 });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    console.log('   Navigating to https://www.amazon.in...');
    await page.goto('https://www.amazon.in', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('   Waiting for JavaScript to execute...');
    await page.waitForTimeout(3000);
    
    // Trigger any lazy-loaded scripts
    await page.evaluate(() => {
      window.scrollTo(0, 100);
      window.scrollTo(0, 0);
    });
    
    await page.waitForTimeout(2000);
    
    const cookies = await context.cookies();
    
    console.log(`✓ Successfully scanned amazon.in`);
    console.log(`✓ Found ${cookies.length} cookies\n`);
    
    if (cookies.length > 0) {
      console.log('   Sample cookies:');
      cookies.slice(0, 5).forEach((cookie, i) => {
        console.log(`   ${i + 1}. ${cookie.name} (${cookie.domain})`);
      });
      
      if (cookies.length > 5) {
        console.log(`   ... and ${cookies.length - 5} more\n`);
      } else {
        console.log('');
      }
    }
    
    await browser.close();
    
    if (cookies.length < 4) {
      console.warn('⚠️  Warning: Expected more cookies from amazon.in');
      console.warn('   This might indicate an issue with cookie detection.\n');
      return false;
    }
    
    console.log('✅ Real website scan successful!\n');
    return true;
    
  } catch (error) {
    console.error('✗ Real website scan failed:', error.message);
    
    if (error.message.includes('Target page, context or browser has been closed')) {
      console.error('\n⚠️  This is the issue you reported!');
      console.error('   The browser is closing before the page can load.');
      console.error('   Possible causes:');
      console.error('   1. Browserless server timeout (website takes too long)');
      console.error('   2. Website blocking automated browsers');
      console.error('   3. Memory/resource limits on Browserless');
      console.error('   4. Network instability\n');
      console.error('   Recommendations:');
      console.error('   - Try a simpler website first (e.g., example.com)');
      console.error('   - Check your Browserless subscription limits');
      console.error('   - Contact Browserless support if issue persists\n');
    }
    
    return false;
  }
}

// Main execution
async function main() {
  console.clear();
  
  const basicTestsPassed = await testBrowserlessConnection();
  
  if (basicTestsPassed) {
    console.log('-------------------------------------------\n');
    await testRealWebsiteScan();
  }
  
  console.log('-------------------------------------------');
  console.log('📚 For more information:');
  console.log('   - Browserless Docs: https://www.browserless.io/docs');
  console.log('   - Get API Key: https://www.browserless.io/sign-up');
  console.log('   - Support: https://www.browserless.io/contact\n');
}

// Run
main().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
