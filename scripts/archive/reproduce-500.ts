
import { POST } from '../app/api/privacy-centre/verify-otp/route';
import { NextRequest } from 'next/server';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock NextRequest
class MockRequest extends NextRequest {
    constructor(body: any) {
        super('http://localhost:3000/api/privacy-centre/verify-otp', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
}

async function run() {
    console.log('🚀 Starting Reproduction Script');

    // Mock data
    const body = {
        email: 'test@example.com',
        otpCode: '123456',
        visitorId: 'test-visitor',
        widgetId: 'test-widget'
    };

    const req = new MockRequest(body);

    try {
        const res = await POST(req);
        console.log('Response Status:', res.status);
        const data = await res.json();
        console.log('Response Body:', data);
    } catch (error) {
        console.error('🔥 Error calling POST:', error);
    }
}

run();
