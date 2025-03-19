import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, planId } = await req.json();

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Create subscription with trial period
    const subscription = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/2024-01/recurring_application_charges.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        recurring_application_charge: {
          name: 'Standard Plan',
          price: '29.99',
          return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
          trial_days: 14,
          test: process.env.NODE_ENV !== 'production', // Set to true for testing
          capped_amount: 100, // Optional: maximum charge amount
          terms: 'Monthly subscription with 14-day free trial'
        }
      })
    });

    const data = await subscription.json();

    // Store subscription details in your database if needed
    // await db.subscriptions.create({ ... })

    return NextResponse.json({
      success: true,
      subscription: data.recurring_application_charge,
      trialEndsAt: trialEndDate.toISOString()
    });

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 