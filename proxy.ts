import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from './lib/auth';

// Paths that don't require authentication
const publicPaths = ['/login', '/api/login'];

export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = publicPaths.includes(path);

  // Check for the session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  let isValidSession = false;

  if (sessionCookie) {
    try {
      const payload = await decrypt(sessionCookie);
      if (payload && payload.user) {
        isValidSession = true;
      }
    } catch (error) {
      // Invalid token
    }
  }

  // Redirect to login if not authenticated and trying to access a protected route
  if (!isValidSession && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if authenticated and trying to access login page
  if (isValidSession && path === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protect all API routes except public ones
  if (path.startsWith('/api/') && !isValidSession && !isPublicPath) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
