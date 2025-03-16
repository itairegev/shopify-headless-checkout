import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

// This endpoint will be called by a CRON job daily
export async function POST(request) {
  try {
    // Get subscriptions with renewals in the next 3 days
    const query = `
      query getUpcomingRenewals {
        subscriptions(first: 100, query: "next_billing_date:<=3d") {
          edges {
            node {
              id
              nextBillingDate
              customer {
                id
                email
                firstName
              }
              lineItems(first: 1) {
                edges {
                  node {
                    title
                    currentPrice
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
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error('Failed to fetch upcoming renewals');
    }

    const subscriptions = data.data.subscriptions.edges;
    const notificationsSent = [];

    for (const { node: subscription } of subscriptions) {
      const daysUntilRenewal = Math.ceil(
        (new Date(subscription.nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder email
      await sendEmail(subscription.customer.email, 'subscription_renewal_reminder', {
        customer_name: subscription.customer.firstName,
        subscription_details: {
          product_title: subscription.lineItems.edges[0]?.node.title,
          next_billing_date: subscription.nextBillingDate,
          price: subscription.lineItems.edges[0]?.node.currentPrice,
          days_until_renewal: daysUntilRenewal
        },
        manage_url: `${process.env.NEXT_PUBLIC_URL}/account/subscriptions/${subscription.id}`
      });

      notificationsSent.push({
        subscription_id: subscription.id,
        customer_id: subscription.customer.id,
        days_until_renewal: daysUntilRenewal
      });
    }

    return NextResponse.json({ 
      success: true, 
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });
  } catch (error) {
    console.error('Error processing renewal notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 