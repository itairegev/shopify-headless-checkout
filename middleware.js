import { NextResponse } from 'next/server';
import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;

  if (nextUrl.pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/login', nextUrl);
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const email = req.auth?.user?.email;
    if (!email?.endsWith('@zyg.com')) {
      return NextResponse.redirect(new URL('/unauthorized', nextUrl));
    }
  }
});

// Optionally, don't invoke middleware on some paths
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/auth/:path*'
  ]
}; 