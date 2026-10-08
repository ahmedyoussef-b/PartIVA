import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const { pathname } = request.nextUrl;
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/client', request.url));
    }
  }

  if (pathname.startsWith('/client')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role === 'VIEWER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
};
