import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { trackEvent } from '@/lib/analytics';
import { trackSubscriptionMetrics, trackOrderMetrics, trackRetentionMetrics, trackPaymentMetrics } from '@/lib/analytics/subscription-metrics';
import { monitorSubscriptionHealth, monitorOrderFulfillment } from '@/lib/monitoring/subscription-monitor';
import crypto from 'crypto';
import { logger } from '@/lib/logging';

// Verify webhook signature
function verifyWebhook(body, hmacHeader) {
  if (!body || !hmacHeader) {
    return false;
  }
  
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    logger.error('Missing SHOPIFY_WEBHOOK_SECRET');
    return false;
  }

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('base64');
  
  return hmac === hmacHeader;
}

export async function POST(request) {
  const startTime = logger.performance.start('webhook-processing');
  
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    logger.debug('Received webhook', {
      hmacHeader: hmacHeader ? 'present' : 'missing',
      contentLength: body?.length || 0,
    });

    if (!verifyWebhook(body, hmacHeader)) {
      logger.error('Invalid webhook signature', {
        hmacHeader: hmacHeader || 'missing',
        bodyLength: body?.length || 0,
      });
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch (error) {
      logger.error('Failed to parse webhook body', {
        error: error.message,
        bodyLength: body?.length || 0,
      });
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { topic } = data;
    if (!topic) {
      logger.error('Missing webhook topic', { data });
      return NextResponse.json({ error: 'Missing webhook topic' }, { status: 400 });
    }

    logger.info('Processing webhook', {
      topic,
      webhookId: data.id,
    });

    try {
      switch (topic) {
        case 'subscription/created':
          await handleSubscriptionCreated(data);
          break;
        case 'subscription/updated':
          await handleSubscriptionUpdated(data);
          break;
        case 'subscription/cancelled':
          await handleSubscriptionCancelled(data);
          break;
        case 'subscription/payment_failure':
          await handlePaymentFailure(data);
          break;
        case 'orders/create':
          if (data.subscription_id) {
            await handleSubscriptionOrder(data);
          }
          break;
        case 'subscription/payment_success':
          await handlePaymentSuccess(data);
          break;
        default:
          logger.warn(`Unhandled webhook topic: ${topic}`, { data });
      }

      const processingTime = logger.performance.end('webhook-processing', startTime);
      
      logger.info('Webhook processed successfully', {
        topic,
        processingTime,
        webhookId: data.id,
      });

      await trackEvent('webhook_processed', {
        topic,
        processing_time: processingTime,
        success: true
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      const processingTime = logger.performance.end('webhook-processing', startTime);
      
      logger.error('Webhook processing failed', {
        topic,
        error: {
          message: error.message,
          stack: error.stack,
        },
        processingTime,
        webhookId: data.id,
      });

      await trackEvent('webhook_error', {
        topic,
        error: error.message,
        processing_time: processingTime
      });
      
      throw error;
    }
  } catch (error) {
    logger.error('Webhook handler error', {
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('webhook-processing', startTime),
    });
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleSubscriptionCreated(data) {
  const startTime = logger.performance.start('subscription-created');
  const { customer, subscription } = data;
  
  logger.info('Processing new subscription', {
    subscriptionId: subscription.id,
    customerId: customer.id,
  });

  try {
    // Track subscription metrics
    await trackSubscriptionMetrics(subscription, 'created');

    // Monitor subscription health
    const healthMetrics = await monitorSubscriptionHealth(subscription);

    await trackEvent('subscription_created', {
      subscription_id: subscription.id,
      customer_id: customer.id,
      plan_name: subscription.selling_plan.name,
      product_title: subscription.line_items[0].title,
      price: subscription.price,
      currency: subscription.currency,
      health_score: healthMetrics.overall_health_score
    });

    await sendEmail(customer.email, 'subscription_welcome', {
      customer_name: customer.first_name,
      subscription_details: subscription,
      manage_url: `${process.env.NEXT_PUBLIC_URL}/account/subscriptions/${subscription.id}`
    });

    logger.info('New subscription processed successfully', {
      subscriptionId: subscription.id,
      processingTime: logger.performance.end('subscription-created', startTime),
    });
  } catch (error) {
    logger.error('Failed to process new subscription', {
      subscriptionId: subscription.id,
      error: {
        message: error.message,
        stack: error.stack,
      },
      processingTime: logger.performance.end('subscription-created', startTime),
    });
    throw error;
  }
}

async function handleSubscriptionUpdated(data) {
  const { customer, subscription, changes } = data;
  
  // Track subscription metrics
  await trackSubscriptionMetrics(subscription, 'updated', { changes });

  // Monitor subscription health
  const healthMetrics = await monitorSubscriptionHealth(subscription);

  // Track retention metrics after update
  await trackRetentionMetrics(subscription);

  await trackEvent('subscription_updated', {
    subscription_id: subscription.id,
    customer_id: customer.id,
    changes: changes,
    new_plan: subscription.selling_plan.name,
    health_score: healthMetrics.overall_health_score
  });

  await sendEmail(customer.email, 'subscription_updated', {
    customer_name: customer.first_name,
    subscription_details: subscription,
    changes: changes,
    manage_url: `${process.env.NEXT_PUBLIC_URL}/account/subscriptions/${subscription.id}`
  });
}

async function handleSubscriptionCancelled(data) {
  const { customer, subscription, reason } = data;
  
  // Track subscription metrics
  await trackSubscriptionMetrics(subscription, 'cancelled', { reason });

  // Track final retention metrics
  await trackRetentionMetrics(subscription);

  await trackEvent('subscription_cancelled', {
    subscription_id: subscription.id,
    customer_id: customer.id,
    reason: reason,
    cancelled_at: new Date().toISOString(),
    lifetime_value: await calculateLifetimeValue(subscription.id)
  });

  await sendEmail(customer.email, 'subscription_cancelled', {
    customer_name: customer.first_name,
    subscription_details: subscription,
    reactivate_url: `${process.env.NEXT_PUBLIC_URL}/account/subscriptions/${subscription.id}/reactivate`
  });
}

async function handlePaymentFailure(data) {
  const { customer, subscription, failure_reason, attempt_number } = data;
  
  // Track payment metrics
  await trackPaymentMetrics(subscription, {
    payment_method: data.payment_method,
    retry_count: attempt_number,
    last_failure_reason: failure_reason
  });

  // Monitor subscription health
  const healthMetrics = await monitorSubscriptionHealth(subscription);

  const retryDays = getRetryDays(attempt_number);
  
  if (retryDays) {
    await schedulePaymentRetry(subscription.id, retryDays);
    
    await sendEmail(customer.email, 'payment_retry_scheduled', {
      customer_name: customer.first_name,
      subscription_details: subscription,
      failure_reason: failure_reason,
      retry_date: new Date(Date.now() + retryDays * 24 * 60 * 60 * 1000).toISOString(),
      update_payment_url: `${process.env.NEXT_PUBLIC_URL}/account/subscriptions/${subscription.id}/payment`
    });
  } else {
    await pauseSubscription(subscription.id);
    
    await sendEmail(customer.email, 'payment_failed_final', {
      customer_name: customer.first_name,
      subscription_details: subscription,
      failure_reason: failure_reason,
      update_payment_url: `${process.env.NEXT_PUBLIC_URL}/account/subscriptions/${subscription.id}/payment`
    });
  }
}

async function handlePaymentSuccess(data) {
  const { customer, subscription, order } = data;
  
  // Track payment metrics
  await trackPaymentMetrics(subscription, {
    payment_method: data.payment_method,
    retry_count: data.retry_attempt || 0,
    success: true
  });

  // Monitor subscription health
  const healthMetrics = await monitorSubscriptionHealth(subscription);

  await trackEvent('subscription_payment_success', {
    subscription_id: subscription.id,
    customer_id: customer.id,
    order_id: order.id,
    retry_attempt: data.retry_attempt,
    health_score: healthMetrics.overall_health_score
  });

  if (data.retry_attempt) {
    await sendEmail(customer.email, 'payment_retry_success', {
      customer_name: customer.first_name,
      subscription_details: subscription,
      order_details: order
    });
  }
}

async function handleSubscriptionOrder(data) {
  const { customer, order, subscription } = data;
  
  // Track order metrics
  await trackOrderMetrics(order, subscription);

  // Monitor order fulfillment
  const fulfillmentMetrics = await monitorOrderFulfillment(order);

  await trackEvent('subscription_order_created', {
    subscription_id: subscription.id,
    customer_id: customer.id,
    order_id: order.id,
    order_total: order.total_price,
    currency: order.currency,
    fulfillment_status: fulfillmentMetrics.shipping_status,
    estimated_delivery: fulfillmentMetrics.delivery_estimate
  });

  await sendEmail(customer.email, 'order_confirmation', {
    customer_name: customer.first_name,
    order_details: order,
    subscription_details: subscription,
    order_status_url: order.status_url,
    tracking_info: fulfillmentMetrics.tracking_info
  });
}

function getRetryDays(attemptNumber) {
  const retrySchedule = {
    1: 1,   // Retry after 1 day
    2: 3,   // Retry after 3 days
    3: 7    // Final retry after 7 days
  };
  return retrySchedule[attemptNumber];
}

async function schedulePaymentRetry(subscriptionId, daysToRetry) {
  const mutation = `
    mutation schedulePaymentRetry($subscriptionId: ID!, $date: DateTime!) {
      subscriptionPaymentRetry(subscriptionId: $subscriptionId, retryDate: $date) {
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

  const retryDate = new Date(Date.now() + daysToRetry * 24 * 60 * 60 * 1000).toISOString();

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
        date: retryDate
      }
    })
  });

  const data = await response.json();
  if (data.errors || data.data.subscriptionPaymentRetry.userErrors.length > 0) {
    throw new Error('Failed to schedule payment retry');
  }

  return data.data.subscriptionPaymentRetry.subscription;
}

async function pauseSubscription(subscriptionId) {
  const mutation = `
    mutation pauseSubscription($subscriptionId: ID!) {
      subscriptionPause(subscriptionId: $subscriptionId) {
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
  if (data.errors || data.data.subscriptionPause.userErrors.length > 0) {
    throw new Error('Failed to pause subscription');
  }

  return data.data.subscriptionPause.subscription;
} 