import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { draftOrderId } = await req.json();

    // Delete the draft order in Shopify
    const response = await fetch(
      `https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/2024-01/draft_orders/${draftOrderId}.json`,
      {
        method: 'DELETE',
        headers: {
          'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to cancel draft order');
    }

    // Update trial status in your database
    // await db.trials.update({
    //   where: { userId: session.user.id },
    //   data: { status: 'cancelled' }
    // });

    // Remove scheduled conversion
    // await db.scheduledConversions.delete({
    //   where: { draftOrderId }
    // });

    // Send cancellation confirmation email
    // await sendTrialCancellationEmail(session.user.email, {
    //   userName: session.user.name,
    //   startNewTrialUrl: '/pricing'
    // });

    return NextResponse.json({
      success: true,
      message: 'Trial cancelled successfully'
    });

  } catch (error) {
    console.error('Failed to cancel trial:', error);
    return NextResponse.json(
      { error: 'Failed to cancel trial' },
      { status: 500 }
    );
  }
} 