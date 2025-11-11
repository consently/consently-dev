/**
 * Test script to debug the consent record API 500 error
 * Run with: npx tsx test-consent-api-debug.ts
 */

// Sample payload that should work when Accept All is clicked
const testPayload = {
  widgetId: "dpdpa_test_widget",
  visitorId: "test-visitor-123",
  consentStatus: "accepted",
  acceptedActivities: [
    "550e8400-e29b-41d4-a716-446655440000", // Example UUID
    "550e8400-e29b-41d4-a716-446655440001"
  ],
  rejectedActivities: [],
  activityConsents: {
    "550e8400-e29b-41d4-a716-446655440000": {
      status: "accepted",
      timestamp: new Date().toISOString()
    },
    "550e8400-e29b-41d4-a716-446655440001": {
      status: "accepted",
      timestamp: new Date().toISOString()
    }
  },
  metadata: {
    language: "en",
    referrer: null,
    currentUrl: "http://localhost:3000/test",
    pageTitle: "Test Page"
  },
  consentDuration: 365
};

async function testConsentAPI() {
  const apiUrl = 'http://localhost:3000/api/dpdpa/consent-record';
  
  console.log('Testing consent record API...');
  console.log('Payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('\nResponse body:', JSON.stringify(responseData, null, 2));
    
    if (!response.ok) {
      console.error('\n❌ API returned error');
      console.error('Error details:', responseData);
    } else {
      console.log('\n✅ API call successful');
    }
  } catch (error) {
    console.error('\n❌ Failed to call API:', error);
  }
}

testConsentAPI();
