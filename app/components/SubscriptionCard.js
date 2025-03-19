'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';

export default function SubscriptionCard() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartTrial = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/try', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: session?.user?.id,
          planId: 'standard'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trial');
      }

      // Redirect to dashboard where they can start using the product
      window.location.href = '/dashboard';

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Try It For Free
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Start using our service today with no payment required. After your 14-day trial, continue for $29.99/month if you love it.
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ Full access to all features
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ No credit card required
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ Premium support included
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ Cancel anytime during trial
          </Typography>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleStartTrial}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Start Free Trial'
          )}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          No payment information needed • Try all features for 14 days
        </Typography>
      </CardContent>
    </Card>
  );
} 