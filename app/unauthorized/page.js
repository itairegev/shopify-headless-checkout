'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Unauthorized Access
          </h2>
          <div className="mt-4 text-gray-600">
            <p className="mb-4">
              This dashboard is only accessible to users with @zyg.com email addresses.
            </p>
            <p className="mb-4">
              Please sign in with an authorized email address.
            </p>
          </div>
          <div className="mt-6 space-y-4">
            <button
              onClick={handleSignOut}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
            <Link
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 