import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { otp } = await request.json();

        if (!otp) {
            return NextResponse.json(
                { error: 'OTP is required' },
                { status: 400 }
            );
        }

        // 2. Verify OTP
        // Find the most recent unverified, non-expired OTP for this user
        const { data: otpRecord, error: fetchError } = await supabase
            .from('admin_otps')
            .select('*')
            .eq('user_id', user.id)
            .eq('verified', false)
            .gte('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (fetchError || !otpRecord) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP' },
                { status: 400 }
            );
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            return NextResponse.json(
                { error: 'Too many failed attempts. Please request a new OTP.' },
                { status: 400 }
            );
        }

        // Check code
        if (otpRecord.otp_code !== otp) {
            // Increment attempts
            await supabase
                .from('admin_otps')
                .update({ attempts: otpRecord.attempts + 1 })
                .eq('id', otpRecord.id);

            return NextResponse.json(
                { error: 'Invalid OTP' },
                { status: 400 }
            );
        }

        // 3. Mark as verified
        await supabase
            .from('admin_otps')
            .update({
                verified: true,
                verified_at: new Date().toISOString()
            })
            .eq('id', otpRecord.id);

        // 4. Return success token
        // For now, we'll just return success. In a stricter implementation, 
        // we would return a signed JWT or similar to include in the export request.
        // For this implementation, we will trust the client flow or add a short-lived cookie.

        // Let's set a short-lived cookie for export authorization
        const response = NextResponse.json({
            success: true,
            message: 'OTP verified successfully'
        });

        // Set a secure, httpOnly cookie that expires in 5 minutes
        response.cookies.set('export_auth', 'verified', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 300 // 5 minutes
        });

        return response;

    } catch (error) {
        console.error('Error in verify-otp:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
