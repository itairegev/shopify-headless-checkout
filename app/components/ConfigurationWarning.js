import React from 'react';

export function checkShopifyConfig() {
  const requiredEnvVars = {
    'NEXT_PUBLIC_SHOPIFY_STORE_URL': process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL,
    'NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN': process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN,
    'SHOPIFY_ADMIN_API_ACCESS_TOKEN': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    'SHOPIFY_WEBHOOK_SECRET': process.env.SHOPIFY_WEBHOOK_SECRET
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value.includes('your-'))
    .map(([key]) => key);

  return {
    isConfigured: missingVars.length === 0,
    missingVars
  };
}

export default function ConfigurationWarning() {
  const { isConfigured, missingVars } = checkShopifyConfig();

  if (isConfigured) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FEF2F2',
      borderBottom: '1px solid #FCA5A5',
      padding: '0.75rem',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="#DC2626" style={{ width: '20px', height: '20px' }}>
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <div>
        <strong style={{ color: '#991B1B' }}>Configuration Error:</strong>
        <span style={{ color: '#7F1D1D', marginLeft: '0.5rem' }}>
          Missing required Shopify configuration: {missingVars.join(', ')}
        </span>
      </div>
    </div>
  );
} 