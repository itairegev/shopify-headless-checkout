'use client';

import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl });
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-md shadow-sm -space-y-px">
        <div className="mt-4">
          <button
            onClick={handleGoogleSignIn}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with Google
          </button>
        </div>
      </div>
      <div className="text-sm text-center text-gray-500">
        Note: Only @zyg.com email addresses are allowed
      </div>
    </div>
  );
} 