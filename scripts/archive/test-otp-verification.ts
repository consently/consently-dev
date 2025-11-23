/**
 * Test script to verify OTP functionality
 * Run with: npx tsx scripts/test-otp-verification.ts
 */

const WIDGET_ID = 'test-widget'; // Replace with your widget ID
const VISITOR_ID = 'test-visitor-' + Date.now();
const TEST_EMAIL = 'test@example.com'; // Replace with your email

async function testOTP() {
    console.log('🧪 Testing OTP Verification Flow\n');

    // Step 1: Send OTP
    console.log('📧 Step 1: Sending OTP...');
    const sendResponse = await fetch('http://localhost:3000/api/privacy-centre/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: TEST_EMAIL,
            visitorId: VISITOR_ID,
            widgetId: WIDGET_ID,
        }),
    });

    const sendData = await sendResponse.json();
    console.log('Send OTP Response:', {
        status: sendResponse.status,
        data: sendData,
    });

    if (!sendResponse.ok) {
        console.error('❌ Failed to send OTP');
        return;
    }

    console.log('✅ OTP sent successfully\n');

    // Step 2: Ask user for OTP
    console.log('📝 Check your email for the OTP code');
    console.log('⚠️  You need to manually enter the OTP code in the next step\n');

    // For manual testing, you would enter the OTP here
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Enter the OTP code from your email: ', async (otpCode: string) => {
        rl.close();

        console.log('\n🔐 Step 2: Verifying OTP...');
        const verifyResponse = await fetch('http://localhost:3000/api/privacy-centre/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                otpCode: otpCode.trim(),
                visitorId: VISITOR_ID,
                widgetId: WIDGET_ID,
            }),
        });

        const verifyData = await verifyResponse.json();
        console.log('Verify OTP Response:', {
            status: verifyResponse.status,
            data: verifyData,
        });

        if (!verifyResponse.ok) {
            console.error('❌ Failed to verify OTP');
            console.error('Error details:', verifyData);
        } else {
            console.log('✅ OTP verified successfully!');
        }
    });
}

testOTP().catch(console.error);
