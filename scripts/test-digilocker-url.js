#!/usr/bin/env node

/**
 * Test DigiLocker Authorization URL Generation
 * Helps debug OAuth parameter issues
 */

const crypto = require('crypto');

// From .env.local
const config = {
  clientId: 'NQ6399EE1C',
  redirectUri: 'https://consently.in/api/auth/meripehchaan/callback',
  scope: 'avs avs_parent',
  oauthBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
};

// Generate PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Generate state
const state = crypto.randomBytes(32).toString('hex');
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

// Method 1: Using URLSearchParams (current implementation)
const params1 = new URLSearchParams({
  response_type: 'code',
  client_id: config.clientId,
  redirect_uri: config.redirectUri,
  state: state,
  scope: config.scope,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
});

const url1 = `${config.oauthBaseUrl}/authorize?${params1.toString()}`;

console.log('\n=== DigiLocker Authorization URL Test ===\n');
console.log('Configuration:');
console.log('  Client ID:', config.clientId);
console.log('  Redirect URI:', config.redirectUri);
console.log('  Scope:', config.scope);
console.log('  OAuth Base:', config.oauthBaseUrl);
console.log('\nPKCE:');
console.log('  Code Verifier:', codeVerifier);
console.log('  Code Challenge:', codeChallenge);
console.log('  Method: S256');
console.log('\nGenerated URL (URLSearchParams):');
console.log(url1);
console.log('\nURL Length:', url1.length);
console.log('\nParameters:');
params1.forEach((value, key) => {
  console.log(`  ${key}: ${value}`);
});

// Check for common issues
console.log('\n=== Validation ===');
console.log('✓ Client ID format:', /^[A-Z0-9]+$/.test(config.clientId) ? 'OK' : 'INVALID');
console.log('✓ Redirect URI protocol:', config.redirectUri.startsWith('https://') ? 'OK (HTTPS)' : 'WARNING (not HTTPS)');
console.log('✓ Code challenge length:', codeChallenge.length, codeChallenge.length === 43 ? '(OK)' : '(check length)');
console.log('✓ Scope format:', config.scope.includes(' ') ? 'OK (space-separated)' : 'WARNING');

// Try alternative scope format
console.log('\n=== Alternative Scope Formats ===');
const altScopes = [
  'avs avs_parent',
  'avs+avs_parent',
  'avs%20avs_parent',
];

altScopes.forEach(scope => {
  const p = new URLSearchParams({ scope });
  console.log(`Input: "${scope}" → Encoded: ${p.toString()}`);
});

console.log('\n');
