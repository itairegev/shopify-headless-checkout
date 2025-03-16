# Shopify Headless Checkout with Subscription Management

A comprehensive headless checkout solution for Shopify with advanced subscription management capabilities, analytics dashboard, and customer portal.

## Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Dashboard](#dashboard)
- [Analytics](#analytics)
- [Subscription Management](#subscription-management)
- [Webhook Handling](#webhook-handling)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Authentication Setup](#authentication-setup)
- [Logging and Debugging](#logging-and-debugging)

## Features

- 🛒 Headless Checkout Integration
- 📊 Analytics Dashboard
- 💳 Subscription Management
- 📈 Metrics & Reporting
- 📱 Responsive Design
- 🔔 Real-time Notifications
- 📧 Email Notifications
- 🔒 Secure Payment Handling

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Shopify Partner Account
- Shopify Store with Admin API access
- Segment Account (optional, for analytics)
- SendGrid Account (for email notifications)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/shopify-headless-checkout.git
cd shopify-headless-checkout
```

2. Install dependencies:
```bash
npm install
npm install next-auth @auth/core
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables (see Environment Variables section)

5. Run the development server:
```bash
npm run dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Shopify Configuration
NEXT_PUBLIC_SHOPIFY_STORE_URL=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN=your-access-token
SHOPIFY_ADMIN_API_ACCESS_TOKEN=your-admin-access-token
SHOPIFY_WEBHOOK_SECRET=your-webhook-secret

# Analytics Configuration
NEXT_PUBLIC_ANALYTICS_ENABLED=true
SEGMENT_WRITE_KEY=your-segment-write-key

# Email Configuration
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000
```

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── dashboard/         # Dashboard API endpoints
│   │   ├── subscriptions/     # Subscription management endpoints
│   │   └── webhooks/         # Webhook handlers
│   ├── components/            # React components
│   │   └── dashboard/        # Dashboard components
│   └── dashboard/            # Dashboard pages
├── lib/                      # Utility functions
│   ├── analytics.js          # Analytics implementation
│   └── email.js             # Email handling
└── public/                   # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## API Endpoints

### Dashboard Metrics
```
GET /api/dashboard/subscription-metrics
```
Query Parameters:
- `timeRange`: '7d' | '30d' | '90d' | '1y' (default: '30d')

### Subscription Management
```
GET /api/subscriptions
POST /api/subscriptions/[subscriptionId]/skip
POST /api/subscriptions/[subscriptionId]/cancel
PUT /api/subscriptions/[subscriptionId]/update
```

### Webhook Endpoints
```
POST /api/webhooks/subscription
```

## Dashboard

The analytics dashboard provides:

### Key Metrics
- Active Subscriptions
- Monthly Recurring Revenue (MRR)
- Churn Rate
- Customer Lifetime Value (LTV)

### Charts
- Subscription Growth
- Revenue Metrics
- Plan Distribution
- System Health

### Time Ranges
- Last 7 Days
- Last 30 Days
- Last 90 Days
- Last Year

## Analytics

Analytics events tracked:

### Subscription Events
- subscription_created
- subscription_updated
- subscription_cancelled
- subscription_payment_failed
- subscription_payment_success

### Dashboard Events
- dashboard_viewed
- metrics_exported
- filter_applied

### Customer Events
- customer_identified
- page_viewed
- action_performed

## Subscription Management

### Features
- Skip Delivery
- Cancel Subscription
- Update Payment Method
- Change Frequency
- Pause/Resume

### Webhook Events
- subscription/created
- subscription/updated
- subscription/cancelled
- subscription/payment_failure
- orders/create
- subscription/payment_success

## Customization

### Theme Customization
The dashboard uses Material-UI (MUI) and can be customized using the theme provider:

```javascript
// styles/theme.js
import { createTheme } from '@mui/material';

export const theme = createTheme({
  // Your custom theme
});
```

### Analytics Integration
You can customize analytics by modifying `lib/analytics.js`:
- Change analytics provider
- Add custom events
- Modify event transformations

### Email Templates
Email templates can be customized in SendGrid:
- Welcome Email
- Subscription Updates
- Payment Notifications
- Order Confirmations

## Troubleshooting

Common issues and solutions:

### API Connection Issues
- Verify Shopify API credentials
- Check API version compatibility
- Ensure proper CORS configuration

### Webhook Issues
- Verify webhook secret
- Check webhook URL accessibility
- Monitor webhook logs

### Analytics Issues
- Verify Segment write key
- Check analytics enablement
- Monitor tracking calls

## Authentication Setup

### Dependencies Installation

Install the required authentication packages:
```bash
npm install next-auth@latest @auth/core jsonwebtoken
```

### Google OAuth Credentials Setup

Follow these steps to obtain your Google OAuth credentials:

1. **Create a Google Cloud Project**:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the project dropdown at the top of the page
   - Click "New Project"
   - Enter a project name (e.g., "Shopify Headless Checkout")
   - Click "Create"
   - Wait for the project to be created and select it

2. **Enable the Google OAuth API**:
   - In the left sidebar, click "APIs & Services" → "Library"
   - Search for "Google OAuth2"
   - Click on "Google OAuth2 API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**:
   - In the left sidebar, click "APIs & Services" → "OAuth consent screen"
   - Select "External" user type (unless your organization has Google Workspace)
   - Click "Create"
   - Fill in the required information:
     ```
     App name: Your app name
     User support email: Your email
     Developer contact information: Your email
     ```
   - Click "Save and Continue"
   - Under "Scopes", click "Add or Remove Scopes"
   - Select the following scopes:
     ```
     .../auth/userinfo.email
     .../auth/userinfo.profile
     openid
     ```
   - Click "Save and Continue"
   - Under "Test Users", add your @zyg.com email addresses
   - Click "Save and Continue"
   - Review your settings and click "Back to Dashboard"

4. **Create OAuth 2.0 Credentials**:
   - In the left sidebar, click "APIs & Services" → "Credentials"
   - Click "Create Credentials" at the top
   - Select "OAuth client ID"
   - Choose "Web application" as the application type
   - Set the following:
     ```
     Name: Shopify Headless Checkout
     
     Authorized JavaScript origins:
     http://localhost:3000
     https://your-production-domain.com (if applicable)
     
     Authorized redirect URIs:
     http://localhost:3000/api/auth/callback/google
     https://your-production-domain.com/api/auth/callback/google (if applicable)
     ```
   - Click "Create"
   - A popup will show your client ID and client secret
   - Click the download icon to download the credentials as JSON
   - Store these credentials securely

5. **Configure Environment Variables**:
   - Open your `.env.local` file
   - Add the credentials:
     ```env
     GOOGLE_CLIENT_ID=your-client-id
     GOOGLE_CLIENT_SECRET=your-client-secret
     ```
   - Generate a secure secret for NextAuth:
     ```bash
     openssl rand -base64 32
     ```
   - Add the generated secret:
     ```env
     NEXTAUTH_SECRET=your-generated-secret
     NEXTAUTH_URL=http://localhost:3000
     ```

6. **Verify Setup**:
   - Start your development server
   - Visit http://localhost:3000/login
   - Click "Sign in with Google"
   - You should see the Google OAuth consent screen
   - Sign in with a @zyg.com email address
   - You should be redirected to the dashboard

### Production Considerations

1. **Domain Configuration**:
   - Add your production domain to the authorized domains list
   - Add production callback URLs to the OAuth credentials
   - Update `NEXTAUTH_URL` to your production domain

2. **Security**:
   - Use different OAuth credentials for production
   - Store secrets securely (use environment variables)
   - Regularly rotate the `NEXTAUTH_SECRET`
   - Monitor OAuth consent screen settings
   - Regularly review authorized applications

3. **Compliance**:
   - Keep OAuth consent screen information up to date
   - Maintain privacy policy and terms of service URLs
   - Verify scopes are minimal and necessary
   - Monitor and review access patterns

### Implementation Files

1. **Auth Configuration (`auth.js`)**:
```javascript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Only allow @zyg.com emails
      return user.email?.endsWith('@zyg.com') ?? false;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
  },
});
```

2. **Middleware Protection (`middleware.js`)**:
```javascript
import { NextResponse } from 'next/server';
import { auth } from './auth';

export async function middleware(request) {
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await auth();
    
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const email = session?.user?.email;
    if (!email || !email.endsWith('@zyg.com')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
};
```

3. **Auth API Route (`app/api/auth/[...nextauth]/route.js`)**:
```javascript
import { GET, POST } from '../../../../auth';
export { GET, POST };
```

4. **Login Form Component (`app/login/LoginForm.js`)**:
```javascript
'use client';

import { signIn } from '../../../auth';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl });
  };

  return (
    <div className="mt-8 space-y-6">
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        Sign in with Google
      </button>
      <div className="text-center text-gray-500">
        Note: Only @zyg.com email addresses are allowed
      </div>
    </div>
  );
}
```

### Environment Variables

Add these authentication-specific variables to your `.env.local`:

```env
# Authentication Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret  # Generate with: openssl rand -base64 32
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Features

- **Domain Restriction**: Only allows @zyg.com email addresses
- **Protected Routes**: All dashboard routes (`/dashboard/*`) are automatically protected
- **JWT Sessions**: Secure session handling using JWT strategy
- **Google OAuth**: Single sign-on with Google accounts
- **Automatic Redirects**: 
  - Unauthenticated users → Login page
  - Unauthorized users → Unauthorized page
  - Successful login → Original requested page

### Usage

1. **Protected Routes**:
   - All routes under `/dashboard/*` are automatically protected
   - Middleware checks authentication and email domain
   - Unauthorized access attempts are redirected

2. **Login Flow**:
   - User clicks "Sign in with Google"
   - Google OAuth flow is initiated
   - Email domain is verified
   - User is redirected to dashboard or unauthorized page

3. **Session Management**:
   - JWT-based sessions
   - Automatic token refresh
   - Secure session storage

4. **Error Handling**:
   - Clear error messages for unauthorized access
   - Custom error pages
   - Graceful fallbacks

## Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with:
   - Detailed description
   - Steps to reproduce
   - Environment details

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Logging and Debugging

The application includes a comprehensive logging system to help debug issues and monitor application health.

### Log Levels

- `ERROR`: Critical issues that need immediate attention
- `WARN`: Warning conditions that should be reviewed
- `INFO`: General operational information
- `DEBUG`: Detailed information for debugging

### Configuration

In your `.env.local` file, set the following variables:

```env
# Logging Configuration
LOG_LEVEL=DEBUG  # Options: ERROR, WARN, INFO, DEBUG
LOG_TO_FILE=true
REQUEST_LOGGING=true
PERFORMANCE_MONITORING=true
```

### Log Files

In development mode, logs are saved to the `logs` directory:
- Daily log files: `logs/YYYY-MM-DD.log`
- Format: `[timestamp] LEVEL: message metadata`

### Usage

```javascript
import { logger } from '@/lib/logging';

// Log levels
logger.error('Critical error occurred', { error });
logger.warn('Warning condition', { details });
logger.info('Operation completed', { result });
logger.debug('Debug information', { data });

// Performance monitoring
const startTime = logger.performance.start('operation-name');
// ... your code ...
const duration = logger.performance.end('operation-name', startTime);

// Request logging middleware
import { requestLogger } from '@/lib/logging';

export default requestLogger(async function handler(req, res) {
  // Your API route code
});
```

### Log Examples

1. **API Request Logging**:
```
[2024-03-20T10:15:30.123Z] INFO: Incoming request
{
  "requestId": "abc123",
  "method": "POST",
  "url": "/api/subscriptions",
  "duration": 150
}
```

2. **Error Logging**:
```
[2024-03-20T10:15:31.456Z] ERROR: Database connection failed
{
  "error": {
    "code": "ECONNREFUSED",
    "message": "Failed to connect to database"
  },
  "context": {
    "attempt": 1,
    "host": "localhost"
  }
}
```

3. **Performance Monitoring**:
```
[2024-03-20T10:15:32.789Z] INFO: Operation completed
{
  "operation": "subscription-creation",
  "duration": 234,
  "success": true
}
```

### Debugging Tips

1. **Set Log Level**:
   - Use `DEBUG` during development
   - Use `INFO` in staging
   - Use `WARN` or `ERROR` in production

2. **Request Debugging**:
   - Enable `REQUEST_LOGGING=true`
   - Check `logs/YYYY-MM-DD.log` for request details
   - Each request has a unique `requestId`

3. **Performance Issues**:
   - Enable `PERFORMANCE_MONITORING=true`
   - Monitor operation durations
   - Look for slow operations in logs

4. **Error Investigation**:
   - Check error stack traces in logs
   - Review error metadata
   - Cross-reference with request logs

### Log Retention

- Development: Logs are kept for 7 days
- Production: Configure log retention based on requirements
- Use log rotation to manage file sizes

### Security Considerations

- Logs are automatically sanitized
- Sensitive data is redacted
- Stack traces only in development
- No PII in production logs
