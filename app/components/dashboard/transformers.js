export function transformSubscriptionData(data) {
  // Convert time series data into chart format
  const dates = generateDateArray(30); // Last 30 days
  return dates.map((date, index) => ({
    date: date.toLocaleDateString(),
    active: data.subscription_metrics.total_active - index, // Simplified for example
    new: data.subscription_metrics.new_subscriptions[index] || 0,
    cancelled: data.subscription_metrics.cancelled_subscriptions[index] || 0
  }));
}

export function transformRevenueData(data) {
  const dates = generateDateArray(12); // Last 12 months
  return dates.map((date) => ({
    date: date.toLocaleDateString('en-US', { month: 'short' }),
    mrr: data.revenue_metrics.mrr,
    orderValue: data.revenue_metrics.average_order_value
  }));
}

export function transformPlanData(data) {
  return Object.entries(data.subscription_metrics.by_plan).map(([name, value]) => ({
    name,
    value
  }));
}

export function transformHealthData(data) {
  return [
    {
      name: 'Payment Success',
      value: data.health_metrics.payment_success_rate * 100
    },
    {
      name: 'Fulfillment Success',
      value: data.health_metrics.fulfillment_success_rate * 100
    },
    {
      name: 'System Uptime',
      value: data.health_metrics.system_uptime * 100
    },
    {
      name: 'Customer Satisfaction',
      value: data.customer_metrics.satisfaction_score * 100
    }
  ];
}

// Helper function to generate date array
function generateDateArray(days) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.unshift(date);
  }
  return dates;
} 