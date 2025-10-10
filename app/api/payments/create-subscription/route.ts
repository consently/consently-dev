import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Razorpay plans mapping
const PLAN_IDS = {
  small: {
    monthly: process.env.RAZORPAY_PLAN_SMALL_MONTHLY,
    amount: 999,
    consents: 10000
  },
  medium: {
    monthly: process.env.RAZORPAY_PLAN_MEDIUM_MONTHLY,
    amount: 2499,
    consents: 100000
  },
  enterprise: {
    monthly: 'custom',
    amount: 0,
    consents: -1
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { plan, billingCycle } = await request.json();

    // Validate plan
    if (!['small', 'medium', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Enterprise plans need custom pricing
    if (plan === 'enterprise') {
      return NextResponse.json(
        { 
          error: 'Enterprise plans require custom pricing',
          message: 'Please contact sales@consently.app for enterprise pricing'
        },
        { status: 400 }
      );
    }

    const planDetails = PLAN_IDS[plan as keyof typeof PLAN_IDS];
    
    // Create Razorpay order
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKey || !razorpaySecret) {
      console.error('Razorpay credentials not configured');
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      );
    }

    // Create order using Razorpay API
    const orderData = {
      amount: planDetails.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${user.id}_${Date.now()}`,
      notes: {
        plan: plan,
        billing_cycle: billingCycle,
        user_id: user.id
      }
    };

    const auth = Buffer.from(`${razorpayKey}:${razorpaySecret}`).toString('base64');
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }

    const order = await response.json();

    // Store subscription intent in database
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan: plan,
        status: 'pending',
        amount: planDetails.amount,
        currency: 'INR',
        billing_cycle: billingCycle,
        payment_provider: 'razorpay',
        payment_id: order.id
      });

    if (dbError) {
      console.error('Failed to store subscription:', dbError);
    }

    // Return order details for frontend
    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKey,
      plan: plan,
      planDetails: planDetails
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
