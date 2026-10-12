import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Proxy Next.js 16 (ex-middleware — D72, E0-S08).
 *
 * Deux responsabilités :
 *  1. Protection des routes /admin/* et /client/* (rôles ADMIN/USER/VIEWER).
 *  2. Mode placeholder (E5-S02) — si NEXT_PUBLIC_PLACEHOLDER_MODE=true,
 *     les zones fonctionnelles (recherche, admin, client, API métier)
 *     redirigent vers /placeholder. La vitrine publique (/, /services,
 *     /contact, /materiaux, /demande, /login, /register, ...) et les
 *     routes de support (/api/health, /api/auth/*) restent accessibles.
 *
 * Sécurité #7 : NEXT_PUBLIC_PLACEHOLDER_MODE est un booléen de feature
 * flag, jamais un secret.
 */

const PLACEHOLDER_MODE = process.env.NEXT_PUBLIC_PLACEHOLDER_MODE === 'true';

/** Routes publiques — toujours accessibles (vitrine + funnel + support). */
const PUBLIC_ROUTES = [
  '/',
  '/services',
  '/contact',
  '/materiaux',
  '/demande',
  '/comment-ca-marche',
  '/login',
  '/register',
  '/forgot-password',
  '/placeholder',
  '/api/health',
  '/api/auth',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Assets statiques Next.js — jamais interceptés. */
function isStaticAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.') // fichiers statiques (images, fonts, etc.)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mode placeholder : bloquer les zones fonctionnelles non publiques.
  // Appliqué AVANT la logique de rôles — en mode placeholder, aucune
  // route fonctionnelle n'est accessible, même authentifiée.
  if (PLACEHOLDER_MODE && !isPublicRoute(pathname) && !isStaticAsset(pathname)) {
    return NextResponse.redirect(new URL('/placeholder', request.url));
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

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
  // Matcher étendu (E5-S02) : /admin/*, /client/* (protection rôles)
  // + routes fonctionnelles (mode placeholder). Les assets statiques
  // et les routes publiques sont exclus par la logique du proxy.
  matcher: [
    '/admin/:path*',
    '/client/:path*',
    '/api/search/:path*',
    '/api/parts/:path*',
    '/api/requests/:path*',
    '/api/upload/:path*',
    '/api/sync/:path*',
  ],
};
