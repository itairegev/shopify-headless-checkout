'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { useSession } from 'next-auth/react';

export default function TrialExpiration({ trialEndDate }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const end = new Date(trialEndDate);
    const now = new Date();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    setDaysLeft(days);
  }, [trialEndDate]);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions/create', {
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
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Redirect to Shopify's checkout page
      if (data.subscription?.confirmation_url) {
        window.location.href = data.subscription.confirmation_url;
      } else {
        throw new Error('No payment URL provided');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (daysLeft > 3) {
    return null; // Don't show anything if more than 3 days left
  }

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4, bgcolor: daysLeft <= 0 ? '#fff8e1' : 'white' }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom color={daysLeft <= 0 ? 'error' : 'inherit'}>
          {daysLeft <= 0 ? 'Trial Expired' : `${daysLeft} Days Left in Trial`}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {daysLeft <= 0 
            ? 'Your trial has ended. Subscribe now to continue using all features.'
            : 'Your free trial is ending soon. Subscribe now to keep using all features.'}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ Continue with all features
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ No interruption in service
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            ✓ Cancel anytime
          </Typography>
        </Box>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          color={daysLeft <= 0 ? 'error' : 'primary'}
          fullWidth
          sx={{ mt: 3 }}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            `Subscribe Now - $29.99/month`
          )}
        </Button>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Secure payment with Shopify • Cancel anytime
        </Typography>
      </CardContent>
    </Card>
  );
} 