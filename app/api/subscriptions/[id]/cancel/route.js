import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const subscriptionId = params.id;

    const mutation = `
      mutation cancelSubscription($subscriptionId: ID!) {
        subscriptionCancel(subscriptionId: $subscriptionId) {
          subscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { subscriptionId }
      })
    });

    const data = await response.json();

    if (data.errors || data.data.subscriptionCancel.userErrors.length > 0) {
      const errors = data.errors || data.data.subscriptionCancel.userErrors;
      console.error('GraphQL Errors:', errors);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json(data.data.subscriptionCancel.subscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 