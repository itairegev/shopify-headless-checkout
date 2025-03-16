import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const subscriptionId = params.id;

    const mutation = `
      mutation subscriptionSkipNextOrder($subscriptionId: ID!) {
        subscriptionSkipNextOrder(subscriptionId: $subscriptionId) {
          subscription {
            id
            status
            nextBillingDate
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

    if (data.errors || data.data.subscriptionSkipNextOrder.userErrors.length > 0) {
      const errors = data.errors || data.data.subscriptionSkipNextOrder.userErrors;
      console.error('GraphQL Errors:', errors);
      return NextResponse.json({ error: 'Failed to skip next delivery' }, { status: 500 });
    }

    return NextResponse.json(data.data.subscriptionSkipNextOrder.subscription);
  } catch (error) {
    console.error('Error skipping next delivery:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 