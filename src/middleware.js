import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get('daranett_session')?.value;

  // Paths that do not require authentication
  const isAuthRoute = pathname === '/login' || pathname.startsWith('/api/auth');
  const isStaticAsset = pathname.startsWith('/_next') || pathname.includes('.') || pathname === '/favicon.ico';

  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users trying to access protected pages to login
  if (!session && !isAuthRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access login page back to dashboard
  if (session && pathname === '/login') {
    const dashboardUrl = new URL('/', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Apply middleware to all matching paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
