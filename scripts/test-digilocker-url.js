#!/usr/bin/env node

/**
 * Test DigiLocker/MeriPehchaan Authorization URL Generation
 * Helps debug OAuth parameter issues
 */

const crypto = require('crypto');

// From .env.local
const config = {
  clientId: process.env.APISETU_CLIENT_ID || 'XK19761845',
  redirectUri: process.env.APISETU_REDIRECT_URI || 'https://www.consently.in/api/auth/meripehchaan/callback',
  scope: process.env.DIGILOCKER_AGE_VERIFICATION_SCOPE || 'avs',
  oauthBaseUrl: process.env.DIGILOCKER_OAUTH_BASE_URL || 'https://digilocker.meripehchaan.gov.in/public/oauth2/1',
  dlFlow: process.env.DIGILOCKER_DL_FLOW || 'signin',
  acr: process.env.DIGILOCKER_ACR || 'opus_er_alias+mobile+user_alias+email+aadhaar+pan+driving_licence',
  amr: process.env.DIGILOCKER_AMR || 'all',
  pla: process.env.DIGILOCKER_PLA || 'Y',
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

// Build URL matching MeriPehchaan/NSSO expected format
const params = new URLSearchParams({
  response_type: 'code',
  client_id: config.clientId,
  state: state,
  redirect_uri: config.redirectUri,
  code_challenge: codeChallenge,
  code_challenge_method: 'S256',
  dl_flow: config.dlFlow,
  amr: config.amr,
  scope: config.scope,
  pla: config.pla,
});

// Append acr separately to preserve literal + signs
const url = `${config.oauthBaseUrl}/authorize?${params.toString()}&acr=${config.acr}`;

console.log('\n=== MeriPehchaan/NSSO Authorization URL Test ===\n');
console.log('Configuration:');
console.log('  Client ID:', config.clientId);
console.log('  Redirect URI:', config.redirectUri);
console.log('  Scope:', config.scope);
console.log('  OAuth Base:', config.oauthBaseUrl);
console.log('  DL Flow:', config.dlFlow);
console.log('  ACR:', config.acr);
console.log('  AMR:', config.amr);
console.log('  PLA:', config.pla);
console.log('\nPKCE:');
console.log('  Code Verifier:', codeVerifier);
console.log('  Code Challenge:', codeChallenge);
console.log('  Method: S256');
console.log('\nGenerated URL:');
console.log(url);
console.log('\nURL Length:', url.length);

// Check for common issues
console.log('\n=== Validation ===');
console.log('  Client ID present:', config.clientId ? 'OK' : 'MISSING');
console.log('  Redirect URI protocol:', config.redirectUri.startsWith('https://') ? 'OK (HTTPS)' : 'WARNING (not HTTPS)');
console.log('  Code challenge length:', codeChallenge.length, codeChallenge.length === 43 ? '(OK)' : '(check length)');
console.log('  dl_flow parameter:', config.dlFlow === 'signin' ? 'OK (signin)' : config.dlFlow);
console.log('  acr contains +:', config.acr.includes('+') ? 'OK (literal + separators)' : 'WARNING');
console.log('  pla parameter:', config.pla === 'Y' ? 'OK (PIN-less auth enabled)' : config.pla);

console.log('\n');
