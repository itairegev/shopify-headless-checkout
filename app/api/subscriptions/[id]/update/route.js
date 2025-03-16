import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const subscriptionId = params.id;
    const { interval } = await request.json();

    // Get the appropriate selling plan ID based on the interval
    const sellingPlanId = await getSellingPlanId(interval);

    const mutation = `
      mutation updateSubscription($subscriptionId: ID!, $input: SubscriptionUpdateInput!) {
        subscriptionUpdate(subscriptionId: $subscriptionId, input: $input) {
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
        variables: {
          subscriptionId,
          input: {
            sellingPlanId
          }
        }
      })
    });

    const data = await response.json();

    if (data.errors || data.data.subscriptionUpdate.userErrors.length > 0) {
      const errors = data.errors || data.data.subscriptionUpdate.userErrors;
      console.error('GraphQL Errors:', errors);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json(data.data.subscriptionUpdate.subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getSellingPlanId(interval) {
  const query = `
    query getSellingPlans {
      sellingPlans(first: 10) {
        edges {
          node {
            id
            name
            deliveryPolicy {
              interval
              intervalCount
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
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  const plans = data.data.sellingPlans.edges;
  const matchingPlan = plans.find(({ node }) => 
    node.deliveryPolicy.interval === interval.interval &&
    node.deliveryPolicy.intervalCount === interval.intervalCount
  );

  if (!matchingPlan) {
    throw new Error('No matching selling plan found for the specified interval');
  }

  return matchingPlan.node.id;
} 