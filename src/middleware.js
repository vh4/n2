import { NextResponse } from 'next/server.js';

/**
 * Next.js Edge Middleware for Route Authentication & Navigation Guards.
 *
 * Responsibilities:
 *  - Guard `/dashboard` against unauthenticated access -> redirects to `/login`.
 *  - Redirect authenticated users visiting `/login` or `/register` -> forwards to `/dashboard`.
 *  - Route root `/` dynamically based on session cookie presence.
 *  - Bypasses internal Next.js assets, static files, and API endpoints.
 *
 * @param {import('next/server').NextRequest} request
 * @returns {NextResponse}
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('n2_session_user')?.value;

  // 1. Guard /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Redirect authenticated users away from public auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 3. Dynamic root router
  if (pathname === '/') {
    if (sessionCookie) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Matcher configuration to ensure middleware executes exclusively on target navigation routes.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/',
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
