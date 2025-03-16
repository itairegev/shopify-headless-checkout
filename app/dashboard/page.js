'use client';

import React from 'react';
import SubscriptionDashboard from '../components/dashboard/SubscriptionDashboard';
import { Box, Container } from '@mui/material';

export default function DashboardPage() {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <SubscriptionDashboard />
      </Box>
    </Container>
  );
} 