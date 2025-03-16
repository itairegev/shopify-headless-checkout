import LoginForm from './LoginForm';

export const metadata = {
  title: 'Login - Shopify Headless Checkout',
  description: 'Login to access the dashboard',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your @zyg.com email address
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
} 