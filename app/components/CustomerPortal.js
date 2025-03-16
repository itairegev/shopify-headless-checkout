'use client'

import { useState, useEffect } from 'react';

export default function CustomerPortal({ customerId }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [customerId]);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch(`/api/subscriptions/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkipDelivery = async (subscriptionId) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/skip`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to skip delivery');
      await fetchSubscriptions(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeFrequency = async (subscriptionId, newInterval) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interval: newInterval })
      });
      if (!response.ok) throw new Error('Failed to update subscription');
      await fetchSubscriptions(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription?')) return;
    
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to cancel subscription');
      await fetchSubscriptions(); // Refresh the list
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">My Subscriptions</h2>
      {subscriptions.length === 0 ? (
        <p>No active subscriptions found.</p>
      ) : (
        <div className="space-y-6">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className="border rounded-lg p-6 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {subscription.productTitle}
                  </h3>
                  <p className="text-gray-600">
                    {subscription.interval} subscription - ${subscription.price}
                  </p>
                  <p className="text-sm text-gray-500">
                    Next delivery: {new Date(subscription.nextDeliveryDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    subscription.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {subscription.status}
                </span>
              </div>

              <div className="flex gap-4">
                <select
                  value={subscription.interval}
                  onChange={(e) =>
                    handleChangeFrequency(subscription.id, e.target.value)
                  }
                  className="border rounded px-3 py-1"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>

                <button
                  onClick={() => handleSkipDelivery(subscription.id)}
                  className="px-4 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Skip Next Delivery
                </button>

                <button
                  onClick={() => handleCancelSubscription(subscription.id)}
                  className="px-4 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                >
                  Cancel Subscription
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 