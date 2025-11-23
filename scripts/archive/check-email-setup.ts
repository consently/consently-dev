#!/usr/bin/env node
/**
 * Check Email Verification Setup
 * 
 * This script checks if everything is configured correctly for email verification
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

// Import the diagnostic function
import { checkResendConfig } from '../lib/resend-email';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════╗', colors.cyan);
  log('║  Email Verification Setup Checker             ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  console.log('\n');

  let issues = 0;
  let warnings = 0;

  // Check 1: Environment Variables
  log('=== Checking Environment Variables ===', colors.cyan);
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'RESEND_API_KEY',
  ];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      const value = process.env[varName]!;
      const masked = value.length > 10 
        ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}`
        : '***';
      success(`${varName} = ${masked}`);
    } else {
      error(`${varName} is not set`);
      issues++;
    }
  }
  
  if (process.env.RESEND_FROM_EMAIL) {
    success(`RESEND_FROM_EMAIL = ${process.env.RESEND_FROM_EMAIL}`);
  } else {
    warning('RESEND_FROM_EMAIL is not set (will use default)');
    warnings++;
  }
  
  console.log('');

  // Check 1.5: Resend Configuration (using diagnostic function)
  log('=== Checking Resend Client Configuration ===', colors.cyan);
  
  const resendConfig = checkResendConfig();
  
  if (resendConfig.apiKeyConfigured) {
    success('RESEND_API_KEY is configured');
  } else {
    error('RESEND_API_KEY is not configured');
    issues++;
  }
  
  if (resendConfig.apiKeyFormatValid) {
    success('RESEND_API_KEY format is valid (starts with "re_")');
    if (resendConfig.apiKeyPrefix) {
      info(`   API Key prefix: ${resendConfig.apiKeyPrefix}`);
    }
  } else {
    error('RESEND_API_KEY format is invalid (should start with "re_")');
    issues++;
  }
  
  if (resendConfig.fromEmailConfigured) {
    success('RESEND_FROM_EMAIL is configured');
  } else {
    warning('RESEND_FROM_EMAIL is not configured (using default)');
    warnings++;
  }
  
  if (resendConfig.clientInitialized) {
    success('Resend client initialized successfully');
  } else {
    error('Resend client failed to initialize');
    issues++;
  }
  
  info(`   From email: ${resendConfig.fromEmail}`);
  
  console.log('');

  // Check 2: Files exist
  log('=== Checking Required Files ===', colors.cyan);
  
  const fs = await import('fs');
  const path = await import('path');
  
  const requiredFiles = [
    'lib/resend-email.ts',
    'app/api/privacy-centre/send-otp/route.ts',
    'app/api/privacy-centre/verify-otp/route.ts',
    'components/privacy-centre/email-link-card.tsx',
    'supabase/migrations/20250119000001_create_email_verification_otp.sql',
  ];
  
  for (const file of requiredFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      success(`${file} exists`);
    } else {
      error(`${file} is missing`);
      issues++;
    }
  }
  
  console.log('');

  // Check 3: Package dependencies
  log('=== Checking Dependencies ===', colors.cyan);
  
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    const requiredPackages = ['resend', '@supabase/supabase-js', 'sonner'];
    
    for (const pkg of requiredPackages) {
      if (packageJson.dependencies[pkg] || packageJson.devDependencies?.[pkg]) {
        success(`${pkg} is installed`);
      } else {
        error(`${pkg} is not installed`);
        issues++;
      }
    }
  } catch (err) {
    error('Failed to read package.json');
    issues++;
  }
  
  console.log('');

  // Summary
  log('=== Summary ===', colors.cyan);
  
  if (issues === 0 && warnings === 0) {
    success('All checks passed! Email verification should work correctly.');
    console.log('');
    info('Next steps:');
    console.log('  1. Make sure database migration is applied');
    console.log('  2. Test with: npx tsx scripts/test-email-verification.ts your@email.com');
  } else if (issues === 0) {
    warning(`${warnings} warning(s) found. Email verification should still work.`);
    console.log('');
    info('Review warnings above and fix if needed');
  } else {
    error(`${issues} issue(s) found that need to be fixed!`);
    if (warnings > 0) {
      warning(`Also ${warnings} warning(s) found`);
    }
    console.log('');
    info('To fix issues:');
    console.log('  1. Create/update .env.local with required variables');
    console.log('  2. Run: npm install resend');
    console.log('  3. Check that all files exist in the project');
  }
  
  console.log('');
  info('Documentation:');
  console.log('  Setup: docs/setup/EMAIL_VERIFICATION_SETUP.md');
  console.log('  Troubleshooting: docs/fixes/EMAIL_VERIFICATION_TROUBLESHOOTING.md');
  console.log('');
}

main().catch((err) => {
  error(`Unhandled error: ${err}`);
  process.exit(1);
});

