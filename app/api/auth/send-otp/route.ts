import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendAdminOTPEmail, generateOTP } from '@/lib/resend-email';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user || !user.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { action = 'export data' } = await request.json().catch(() => ({}));

        // 2. Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 3. Store OTP in database
        const { error: dbError } = await supabase
            .from('admin_otps')
            .insert({
                user_id: user.id,
                otp_code: otpCode,
                expires_at: expiresAt.toISOString(),
                verified: false
            });

        if (dbError) {
            console.error('Error storing OTP:', dbError);
            return NextResponse.json(
                { error: 'Failed to generate OTP' },
                { status: 500 }
            );
        }

        // 4. Send email
        const { success, error: emailError } = await sendAdminOTPEmail(
            user.email,
            otpCode,
            action
        );

        if (!success) {
            console.error('Error sending OTP email:', emailError);
            return NextResponse.json(
                { error: 'Failed to send OTP email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'OTP sent successfully',
            email: user.email // Return email so UI can show masked version
        });

    } catch (error) {
        console.error('Error in send-otp:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
