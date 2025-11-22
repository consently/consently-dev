// Quick test for OTP verification API
// This will help diagnose if the API is working

const testWidgetId = 'demo-widget'; // You can change this
const testVisitorId = `visitor-${Date.now()}`;
const testEmail = 'test@example.com';

console.log('Testing OTP flow with:', {
    widgetId: testWidgetId,
    visitorId: testVisitorId,
    email: testEmail,
});

// Test 1: Send OTP
fetch('http://localhost:3000/api/privacy-centre/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: testEmail,
        visitorId: testVisitorId,
        widgetId: testWidgetId,
    }),
})
    .then(res => res.json())
    .then(data => {
        console.log('Send OTP Result:', data);
        console.log('\n✅ Check your email for the OTP code');
        console.log('⚠️  Then enter it below to test verification\n');
    })
    .catch(err => console.error('Send OTP Error:', err));
