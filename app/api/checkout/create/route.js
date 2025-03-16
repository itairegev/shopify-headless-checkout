import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

const BASE_PRICE = 1999; // Base price in cents ($19.99)
const SUBSCRIPTION_ADJUSTMENTS = {
  monthly: 0.10, // 10% off
  yearly: 0.20  // 20% off
};

// These IDs need to be set up in Shopify Admin under Products > Selling Plans
const SELLING_PLAN_GROUPS = {
  monthly: 'gid://shopify/SellingPlanGroup/monthly_subscription',
  yearly: 'gid://shopify/SellingPlanGroup/yearly_subscription'
};

const SUBSCRIPTION_PLANS = {
  'one-time': {
    type: 'one-time',
    variantId: process.env.SHOPIFY_PRODUCT_VARIANT_ID, // Your product variant ID
    getPrice: () => BASE_PRICE
  },
  'monthly': {
    type: 'recurring',
    interval: 'month',
    variantId: process.env.SHOPIFY_PRODUCT_VARIANT_ID,
    sellingPlanGroupId: SELLING_PLAN_GROUPS.monthly,
    getPrice: () => Math.round(BASE_PRICE * (1 - SUBSCRIPTION_ADJUSTMENTS.monthly))
  },
  'annual': {
    type: 'recurring',
    interval: 'year',
    variantId: process.env.SHOPIFY_PRODUCT_VARIANT_ID,
    sellingPlanGroupId: SELLING_PLAN_GROUPS.yearly,
    getPrice: () => Math.round(BASE_PRICE * 12 * (1 - SUBSCRIPTION_ADJUSTMENTS.yearly))
  }
};

// Helper function to format price for display
function formatPrice(cents) {
  return (cents / 100).toFixed(2);
}

async function createCheckoutSession({ customerEmail, customerName, postalCode, plan }) {
  const startTime = logger.performance.start('checkout-creation');
  
  logger.info('Creating checkout session', {
    customerEmail,
    plan: {
      type: plan.type,
      interval: plan.interval,
    },
  });

  try {
    // First, get the selling plan ID if this is a subscription
    let sellingPlanId;
    if (plan.type === 'recurring') {
      logger.debug('Fetching selling plan ID', {
        groupId: plan.sellingPlanGroupId,
        interval: plan.interval,
      });
      
      sellingPlanId = await getSellingPlanId(plan.sellingPlanGroupId, plan.interval);
    }

    const query = `
      mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            webUrl
          }
          checkoutUserErrors {
            code
            field
            message
          }
        }
      }
    `;

    const [firstName, ...lastNameParts] = customerName.split(' ');
    const lastName = lastNameParts.join(' ');

    const variables = {
      input: {
        email: customerEmail,
        lineItems: [
          {
            variantId: plan.variantId,
            quantity: 1,
            ...(sellingPlanId && {
              sellingPlanId
            })
          }
        ],
        shippingAddress: {
          firstName,
          lastName: lastName || '',
          address1: '',
          city: '',
          province: '',
          country: 'US',
          zip: postalCode
        }
      }
    };

    logger.debug('Sending checkout creation request', {
      query: 'checkoutCreate mutation',
      variables: {
        ...variables,
        input: {
          ...variables.input,
          email: '***@***.com', // Redacted for logging
        },
      },
    });

    const response = await fetch(process.env.SHOPIFY_STORE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`);
      logger.error('Checkout creation HTTP error', {
        status: response.status,
        statusText: response.statusText,
        processingTime: logger.performance.end('checkout-creation', startTime),
      });
      throw error;
    }

    const data = await response.json();

    if (data.errors) {
      logger.error('Shopify API Errors', {
        errors: data.errors,
        processingTime: logger.performance.end('checkout-creation', startTime),
      });
      throw new Error('Failed to create checkout');
    }

    const checkoutUrl = data?.data?.checkoutCreate?.checkout?.webUrl;
    if (!checkoutUrl) {
      logger.error('No checkout URL in response', {
        response: data,
        processingTime: logger.performance.end('checkout-creation', startTime),
      });
      throw new Error('Failed to create checkout');
    }

    logger.info('Checkout created successfully', {
      checkoutId: data?.data?.checkoutCreate?.checkout?.id,
      processingTime: logger.performance.end('checkout-creation', startTime),
    });

    return checkoutUrl;
  } catch (error) {
    logger.error('Checkout creation failed', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('checkout-creation', startTime),
    });
    throw error;
  }
}

export async function POST(request) {
  const startTime = logger.performance.start('checkout-route');
  
  try {
    const body = await request.json();
    
    logger.info('Processing checkout request', {
      planType: body.plan?.type,
    });

    const checkoutUrl = await createCheckoutSession(body);

    logger.info('Checkout route completed', {
      processingTime: logger.performance.end('checkout-route', startTime),
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    logger.error('Checkout route error', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('checkout-route', startTime),
    });

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Helper function to get the correct selling plan ID for subscriptions
async function getSellingPlanId(sellingPlanGroupId, interval) {
  const query = `
    query getSellingPlans($id: ID!) {
      sellingPlanGroup(id: $id) {
        sellingPlans(first: 5) {
          edges {
            node {
              id
              name
              options
            }
          }
        }
      }
    }
  `;

  const response = await fetch(process.env.SHOPIFY_STORE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
    },
    body: JSON.stringify({
      query,
      variables: {
        id: sellingPlanGroupId
      }
    })
  });

  const data = await response.json();
  const plans = data?.data?.sellingPlanGroup?.sellingPlans?.edges || [];
  
  // Find the matching selling plan based on the interval
  const matchingPlan = plans.find(({ node }) => 
    node.name.toLowerCase().includes(interval.toLowerCase())
  );

  if (!matchingPlan) {
    throw new Error(`No selling plan found for interval: ${interval}`);
  }

  return matchingPlan.node.id;
} 