#!/usr/bin/env node
/**
 * Test Contact and Careers Email Functionality
 * 
 * This script tests both contact and careers form email submissions
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

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

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function testContactForm() {
  log('\n=== Testing Contact Form ===', colors.cyan);
  
  const testData = {
    name: 'Test User',
    email: 'test@example.com',
    company: 'Test Company',
    message: 'This is a test message from the contact form. Please ignore.',
  };

  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (!response.ok) {
      error(`Contact form failed: ${result.error}`);
      return false;
    }

    success('Contact form email sent successfully!');
    info(`Response: ${result.message}`);
    if (result.emailId) {
      info(`Email ID: ${result.emailId}`);
    }
    return true;
  } catch (err) {
    error(`Contact form error: ${err}`);
    return false;
  }
}

async function testCareersForm() {
  log('\n=== Testing Careers Form ===', colors.cyan);
  
  const testData = {
    name: 'Test Applicant',
    email: 'applicant@example.com',
    phone: '+91 1234567890',
    position: 'Software Engineer',
    coverLetter: 'This is a test application. Please ignore.',
  };

  try {
    const response = await fetch('http://localhost:3000/api/careers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    const result = await response.json();

    if (!response.ok) {
      error(`Careers form failed: ${result.error}`);
      return false;
    }

    success('Careers application email sent successfully!');
    info(`Response: ${result.message}`);
    if (result.emailId) {
      info(`Email ID: ${result.emailId}`);
    }
    return true;
  } catch (err) {
    error(`Careers form error: ${err}`);
    return false;
  }
}

async function main() {
  console.log('\n');
  log('╔════════════════════════════════════════════════╗', colors.cyan);
  log('║  Contact & Careers Email Test                 ║', colors.cyan);
  log('╚════════════════════════════════════════════════╝', colors.cyan);
  
  info('Make sure your dev server is running on http://localhost:3000');
  info('Both forms will send emails to hello@consently.in');
  console.log('');

  // Check environment variables
  if (!process.env.RESEND_API_KEY) {
    error('RESEND_API_KEY is not set!');
    info('Please add it to your .env.local file');
    process.exit(1);
  }

  success('RESEND_API_KEY is configured');
  console.log('');

  // Test contact form
  const contactOk = await testContactForm();
  
  // Wait a bit between requests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test careers form
  const careersOk = await testCareersForm();

  // Summary
  console.log('');
  log('=== Summary ===', colors.cyan);
  
  if (contactOk && careersOk) {
    success('All tests passed! Both forms are working correctly.');
    console.log('');
    info('Check hello@consently.in inbox for the test emails');
  } else {
    if (!contactOk) {
      error('Contact form test failed');
    }
    if (!careersOk) {
      error('Careers form test failed');
    }
  }
  
  console.log('');
}

main().catch((err) => {
  error(`Unhandled error: ${err}`);
  process.exit(1);
});

