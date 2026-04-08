import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSessionMarker } from '@/lib/auth/adminSession';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('appwrite-session');
  const adminSession = request.cookies.get('admin-session');
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === '/login';
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/');
  const hasAdminSession = !!session?.value
    && !!adminSession?.value
    && await verifyAdminSessionMarker(session.value, adminSession.value);

  if (!hasAdminSession && isAdminPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasAdminSession && isPublicPath) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all routes except Next.js internals, static files, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
