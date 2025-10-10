import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse event
    const event = JSON.parse(body);
    const supabase = await createClient();

    // Handle different event types
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event.payload.payment.entity, supabase);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event.payload.payment.entity, supabase);
        break;

      case 'subscription.activated':
        await handleSubscriptionActivated(event.payload.subscription.entity, supabase);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.payload.subscription.entity, supabase);
        break;

      case 'subscription.charged':
        await handleSubscriptionCharged(event.payload.subscription.entity, supabase);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCaptured(payment: any, supabase: any) {
  console.log('Payment captured:', payment.id);
  
  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      payment_id: payment.id,
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.order_id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handlePaymentFailed(payment: any, supabase: any) {
  console.log('Payment failed:', payment.id);
  
  // Update subscription status
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', payment.order_id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handleSubscriptionActivated(subscription: any, supabase: any) {
  console.log('Subscription activated:', subscription.id);
  
  // Update user subscription
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.notes?.user_id);

  if (error) {
    console.error('Failed to update user:', error);
  }
}

async function handleSubscriptionCancelled(subscription: any, supabase: any) {
  console.log('Subscription cancelled:', subscription.id);
  
  // Update subscription and user
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', subscription.id);

  if (subError) {
    console.error('Failed to update subscription:', subError);
  }

  const { error: userError } = await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.notes?.user_id);

  if (userError) {
    console.error('Failed to update user:', userError);
  }
}

async function handleSubscriptionCharged(subscription: any, supabase: any) {
  console.log('Subscription charged:', subscription.id);
  
  // Extend subscription end date
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      end_date: endDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('payment_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}
