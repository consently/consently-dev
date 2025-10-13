import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logFailure, logSuccess } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile from users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      await logFailure(user.id, 'user.update', 'users', error.message, request);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // Also fetch subscription details
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      profile,
      subscription: subscription || null,
      auth: {
        email: user.email,
        emailVerified: user.email_confirmed_at !== null,
        lastSignIn: user.last_sign_in_at,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: updateData.full_name,
        avatar_url: updateData.avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      await logFailure(user.id, 'user.update', 'users', error.message, request);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Log success
    await logSuccess(user.id, 'user.update', 'users', user.id, updateData, request);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update specific fields (like email or password)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, ...data } = body;

    if (action === 'update-email') {
      // Update email
      const { email } = data;
      if (!email || !z.string().email().safeParse(email).success) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }

      const { error } = await supabase.auth.updateUser({ email });

      if (error) {
        console.error('Error updating email:', error);
        await logFailure(user.id, 'user.update', 'users', error.message, request);
        return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
      }

      // Log success
      await logSuccess(user.id, 'user.update', 'users', user.id, { action: 'email-update' }, request);

      return NextResponse.json({ message: 'Email update initiated. Check your inbox for confirmation.' });
    } else if (action === 'update-password') {
      // Update password
      const { password } = data;
      if (!password || password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('Error updating password:', error);
        await logFailure(user.id, 'user.update', 'users', error.message, request);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
      }

      // Log success
      await logSuccess(user.id, 'user.update', 'users', user.id, { action: 'password-update' }, request);

      return NextResponse.json({ message: 'Password updated successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete user from users table (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      await logFailure(user.id, 'user.delete', 'users', deleteError.message, request);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    // Log success (before sign out)
    await logSuccess(user.id, 'user.delete', 'users', user.id, undefined, request);

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
