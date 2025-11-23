/**
 * Simple script to check verify-otp endpoint directly
 * 
 * Usage:
 * 1. Start your dev server (npm run dev)
 * 2. Run: node --loader ts-node/esm scripts/check-verifyotp-issue.ts
 */

// Test payload (replace with your actual values from the browser)
const testPayload = {
    email: "consently.project@gmail.com", // Replace with the email from your browser
    otpCode: "123456", // This will fail, but we want to  see the error
    visitorId: "dpdpa_mhnhlpjmc_atq70ak9", // From your browser URL
    widgetId: "CNST-M9R6-2SGE-Q2RT" // From your browser URL
};

async function testVerifyOTP() {
    console.log('\n🔍 Testing verify-otp endpoint...\n');
    console.log('Test payload:', testPayload);

    try {
        console.log('\n📡 Sending request to http://localhost:3000/api/privacy-centre/verify-otp');

        const response = await fetch('http://localhost:3000/api/privacy-centre/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
        });

        console.log('\n📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('\n📄 Raw response:', responseText);

        try {
            const data = JSON.parse(responseText);
            console.log('\n✅ Parsed JSON response:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('\n❌ Failed to parse response as JSON');
        }

        if (!response.ok) {
            console.log('\n❌ Request failed with status:', response.status);

            if (response.status === 500) {
                console.log('\n🚨 500 ERROR - This is the issue!');
                console.log('Check your Next.js server terminal for the actual error stack trace.');
                console.log('\nCommon causes:');
                console.log('  1. Database connection issues');
                console.log('  2. Missing environment variables');
                console.log('  3. Unhandled exceptions in the route handler');
                console.log('  4. Email service errors (even though marked non-critical)');
            }
        }

    } catch (error: any) {
        console.error('\n💥 Exception occurred:', error.message);
        console.error('Full error:', error);
    }
}

testVerifyOTP();
