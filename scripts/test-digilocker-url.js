#!/usr/bin/env node

/**
 * Test MeriPehchaan Authorization URL Generation
 *
 * Validates that the authorize URL matches what API Setu expects.
 * Only standard OAuth 2.0 + PKCE params are sent — MeriPehchaan-specific
 * params (ACR, AMR, flow, PLA) are controlled by the AuthPartner dashboard.
 */

const crypto = require('crypto');

// From .env.local — must match API Setu AuthPartner dashboard EXACTLY
const config = {
  clientId: process.env.APISETU_CLIENT_ID || 'JM56F33ABE',
  redirectUri: process.env.APISETU_REDIRECT_URI || 'https://www.consently.in/api/auth/meri-pehchaan/callback',
  scope: 'openid age_verification',
  oauthBaseUrl: 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
};

// Generate PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Generate state + PKCE
const state = crypto.randomBytes(32).toString('hex');
const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

// Build URL — standard OAuth 2.0 + PKCE only
const params = new URLSearchParams({
  response_type: 'code',
  client_id: config.clientId,
  state: state,
  redirect_uri: config.redirectUri,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  scope: config.scope,
});

const url = `${config.oauthBaseUrl}/authorize?${params.toString()}`;

console.log('\n=== MeriPehchaan Authorization URL Test ===\n');
console.log('Configuration:');
console.log('  Client ID:', config.clientId);
console.log('  Redirect URI:', config.redirectUri);
console.log('  Scope:', config.scope);
console.log('  OAuth Base:', config.oauthBaseUrl);
console.log('\nPKCE:');
console.log('  Code Verifier:', codeVerifier);
console.log('  Code Challenge:', codeChallenge);
console.log('  Method: S256');
console.log('\nGenerated URL:');
console.log(url);
console.log('\nURL Length:', url.length);

// Validation checks
console.log('\n=== Validation ===');
console.log('  Client ID present:', config.clientId ? 'OK' : 'MISSING');
console.log('  Redirect URI has hyphen:', config.redirectUri.includes('meri-pehchaan') ? 'OK (meri-pehchaan)' : 'ERROR: must use meri-pehchaan with hyphen');
console.log('  Redirect URI protocol:', config.redirectUri.startsWith('https://') ? 'OK (HTTPS)' : 'WARNING (not HTTPS)');
console.log('  Redirect URI has www:', config.redirectUri.includes('www.') ? 'OK (www)' : 'WARNING (missing www)');
console.log('  Code challenge length:', codeChallenge.length, codeChallenge.length === 43 ? '(OK)' : '(check length)');
console.log('  Scope:', config.scope);
console.log('\n  NOTE: ACR, AMR, dl_flow, PLA are controlled by API Setu dashboard');
console.log('  These params are NOT sent in the authorize URL.\n');
