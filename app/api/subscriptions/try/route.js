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

    // Create a draft subscription that will activate in 14 days
    const subscription = await fetch(`https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        draft_order: {
          line_items: [{
            title: 'Standard Plan Subscription',
            price: '29.99',
            quantity: 1,
            requires_shipping: false
          }],
          customer: {
            id: customerId
          },
          note: 'TBYB subscription - Auto-activates after 14 days',
          payment_terms: {
            payment_schedules: [{
              amount: '29.99',
              currency: 'USD',
              issued_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            }]
          }
        }
      })
    });

    const draftOrderData = await subscription.json();

    if (!draftOrderData.draft_order) {
      throw new Error('Failed to create draft subscription');
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Store trial and draft order information
    const trialUser = {
      userId: session.user.id,
      email: session.user.email,
      trialStartDate: new Date(),
      trialEndDate: trialEndDate,
      planId: planId,
      status: 'active',
      draftOrderId: draftOrderData.draft_order.id
    };

    // Store trial user in your database
    // await db.trials.create(trialUser);

    // Schedule the automatic conversion
    await fetch(`/api/subscriptions/schedule-conversion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draftOrderId: draftOrderData.draft_order.id,
        userId: session.user.id,
        conversionDate: trialEndDate
      })
    });

    // Send welcome email with trial details and auto-subscription info
    // await sendWelcomeEmail(session.user.email, {
    //   trialEndDate: trialEndDate,
    //   userName: session.user.name,
    //   cancelUrl: `/account/trial/cancel?draftOrderId=${draftOrderData.draft_order.id}`
    // });

    return NextResponse.json({
      success: true,
      trial: {
        startDate: new Date(),
        endDate: trialEndDate,
        status: 'active',
        draftOrderId: draftOrderData.draft_order.id
      }
    });

  } catch (error) {
    console.error('Trial creation error:', error);
    return NextResponse.json(
      { error: 'Failed to start trial' },
      { status: 500 }
    );
  }
} 