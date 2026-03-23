import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('appwrite-session');
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === '/login';
  const hasSession = !!session?.value;

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply to all routes except Next.js internals, static files, and favicon
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
