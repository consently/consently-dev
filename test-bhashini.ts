/**
 * Test script for Bhashini Translation API
 * Run with: npx tsx test-bhashini.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { translateWithBhashini, getPipelineConfig } from './lib/bhashini-translate';

// Load .env.local file
try {
  const envPath = join(process.cwd(), '.env.local');
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('Note: Could not load .env.local file');
}

async function testBhashiniAPI() {
  console.log('🧪 Testing Bhashini Translation API...\n');
  
  // Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const pipelineId = process.env.BHASHINI_PIPELINE_ID;
  
  if (!apiKey) {
    console.error('❌ BHASHINI_API_KEY not set');
    return;
  }
  if (!userId) {
    console.error('❌ BHASHINI_USER_ID not set');
    return;
  }
  
  console.log('✅ API Key:', apiKey.substring(0, 10) + '...');
  console.log('✅ User ID:', userId.substring(0, 10) + '...');
  console.log('✅ Pipeline ID:', pipelineId || '64392f96daac500b55c543cd (default)');
  console.log();
  
  // Test 1: Pipeline Configuration
  console.log('2️⃣ Testing Pipeline Configuration (en → hi)...');
  try {
    const config = await getPipelineConfig('en', 'hi');
    console.log('✅ Pipeline config retrieved successfully');
    console.log('   Service ID:', config.pipelineResponseConfig[0]?.config[0]?.serviceId);
    console.log('   Callback URL:', config.pipelineInferenceAPIEndPoint.callbackUrl.substring(0, 50) + '...');
    console.log();
  } catch (error) {
    console.error('❌ Pipeline config failed:', error);
    return;
  }
  
  // Test 2: Simple Translation (English to Hindi)
  console.log('3️⃣ Testing Translation: English → Hindi...');
  try {
    const testText = 'Hello, welcome to our platform';
    console.log('   Original:', testText);
    
    const translated = await translateWithBhashini(testText, 'hi', 'en');
    console.log('   Translated:', translated);
    
    if (translated && translated !== testText) {
      console.log('✅ Translation successful!\n');
    } else {
      console.log('⚠️  Translation returned same text (might be fallback)\n');
    }
  } catch (error) {
    console.error('❌ Translation failed:', error);
    console.log();
  }
  
  // Test 3: Multiple Language Pairs
  console.log('4️⃣ Testing Multiple Language Pairs...');
  const languagePairs = [
    { from: 'en', to: 'ta', text: 'Cookie consent', name: 'Tamil' },
    { from: 'en', to: 'te', text: 'Privacy policy', name: 'Telugu' },
    { from: 'en', to: 'bn', text: 'Accept all', name: 'Bengali' },
  ];
  
  for (const pair of languagePairs) {
    try {
      console.log(`   Testing ${pair.name} (${pair.to})...`);
      const translated = await translateWithBhashini(pair.text, pair.to, pair.from);
      console.log(`   ✅ "${pair.text}" → "${translated}"`);
    } catch (error) {
      console.error(`   ❌ ${pair.name} failed:`, error);
    }
  }
  
  console.log('\n✨ Test completed!');
}

// Run the test
testBhashiniAPI().catch(console.error);
