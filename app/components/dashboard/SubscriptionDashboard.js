'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, Select, Grid, Typography, Box, CircularProgress, MenuItem } from '@mui/material';
import {
  transformSubscriptionData,
  transformRevenueData,
  transformPlanData,
  transformHealthData
} from './transformers';

const timeRangeOptions = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '1y', label: 'Last Year' }
];

export default function SubscriptionDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/subscription-metrics?timeRange=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!dashboardData) return null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Subscription Analytics Dashboard</Typography>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {timeRangeOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Grid container spacing={3}>
        {/* Key Metrics Summary */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Key Metrics</Typography>
            <Grid container spacing={2}>
              <MetricCard
                title="Active Subscriptions"
                value={dashboardData.subscription_metrics.total_active}
                change={dashboardData.subscription_metrics.subscription_growth}
              />
              <MetricCard
                title="MRR"
                value={formatCurrency(dashboardData.revenue_metrics.mrr)}
                change={dashboardData.revenue_metrics.revenue_growth}
              />
              <MetricCard
                title="Churn Rate"
                value={formatPercentage(dashboardData.customer_metrics.churn_rate)}
                change={0}
                inverse
              />
              <MetricCard
                title="Customer LTV"
                value={formatCurrency(dashboardData.customer_metrics.customer_lifetime_value)}
                change={0}
              />
            </Grid>
          </Card>
        </Grid>

        {/* Subscription Growth Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Subscription Growth</Typography>
            <ResponsiveContainer>
              <LineChart data={transformSubscriptionData(dashboardData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" stroke="#8884d8" />
                <Line type="monotone" dataKey="new" stroke="#82ca9d" />
                <Line type="monotone" dataKey="cancelled" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Revenue Metrics Chart */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Revenue Metrics</Typography>
            <ResponsiveContainer>
              <BarChart data={transformRevenueData(dashboardData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="mrr" fill="#8884d8" />
                <Bar dataKey="orderValue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Plan Distribution */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>Subscription Plan Distribution</Typography>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={transformPlanData(dashboardData)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                />
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Health Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, height: '400px' }}>
            <Typography variant="h6" gutterBottom>System Health</Typography>
            <ResponsiveContainer>
              <BarChart data={transformHealthData(dashboardData)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function MetricCard({ title, value, change, inverse = false }) {
  const changeColor = inverse
    ? (change > 0 ? 'error' : 'success')
    : (change > 0 ? 'success' : 'error');

  return (
    <Grid item xs={12} sm={6} md={3}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="subtitle1" color="textSecondary">{title}</Typography>
        <Typography variant="h4">{value}</Typography>
        {change !== 0 && (
          <Typography variant="body2" color={changeColor}>
            {change > 0 ? '+' : ''}{formatPercentage(change)}
          </Typography>
        )}
      </Box>
    </Grid>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function formatPercentage(value) {
  return `${(value * 100).toFixed(1)}%`;
} 