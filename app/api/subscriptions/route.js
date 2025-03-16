import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const query = `
      query getCustomerSubscriptions($customerId: ID!) {
        customer(id: $customerId) {
          id
          subscriptions(first: 10) {
            edges {
              node {
                id
                status
                nextBillingDate
                lineItems(first: 1) {
                  edges {
                    node {
                      title
                      currentPrice
                    }
                  }
                }
                sellingPlan {
                  name
                  deliveryPolicy {
                    interval
                    intervalCount
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${process.env.SHOPIFY_STORE_URL}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query,
        variables: { customerId },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const subscriptions = data.data.customer.subscriptions.edges.map(({ node }) => ({
      id: node.id,
      status: node.status,
      nextDeliveryDate: node.nextBillingDate,
      productTitle: node.lineItems.edges[0]?.node.title,
      price: node.lineItems.edges[0]?.node.currentPrice,
      planName: node.sellingPlan.name,
      deliveryInterval: {
        interval: node.sellingPlan.deliveryPolicy.interval,
        intervalCount: node.sellingPlan.deliveryPolicy.intervalCount
      }
    }));

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 