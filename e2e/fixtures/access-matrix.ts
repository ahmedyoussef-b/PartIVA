/**
 * Access matrix — single source of truth for role-based access.
 * Locked decisions V1–V7 (E0-S07b-1-A audit validation).
 *
 * History:
 *  - E0-S07b-1-C: removed /admin and /client bare prefixes (incident n°8)
 *  - E0-S07b-1-C: added finalPath for page-level redirects (incident n°9)
 *  - E0-S07b-1-C: added redirectToViewer for chained middleware redirects
 *    (incident n°15 — VIEWER /admin/* → /client → /)
 */

import type { Role } from './users';

export type Access = 'ALLOW' | 'DENY';

export interface RouteAccess {
  path: string;
  /**
   * Expected final URL after any page-level redirect().
   * If absent, the final URL equals `path`.
   * Used only for ALLOW routes.
   */
  finalPath?: string;
  ADMIN: Access;
  USER: Access;
  VIEWER: Access;
  /**
   * Immediate middleware redirect target for DENY routes.
   * E.g. /admin/* → /client for non-ADMIN.
   */
  redirectTo?: string;
  /**
   * Final redirect target for VIEWER specifically, when the
   * middleware chain produces a different URL than `redirectTo`.
   * E.g. /admin/* → /client → / for VIEWER.
   * If absent, `redirectTo` is used.
   */
  redirectToViewer?: string;
}

export const accessMatrix: RouteAccess[] = [
  // Public routes — accessible to anyone
  { path: '/', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/comment-ca-marche', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/contact', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/demande', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/materiaux', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/services', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/login', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/register', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/forgot-password', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },

  // Admin routes — ADMIN only.
  // USER → /client (single redirect).
  // VIEWER → /client → / (chained redirect, final URL = /).
  {
    path: '/admin/demandes',
    ADMIN: 'ALLOW',
    USER: 'DENY',
    VIEWER: 'DENY',
    redirectTo: '/client',
    redirectToViewer: '/',
  },
  {
    path: '/admin/reverse-engineering',
    ADMIN: 'ALLOW',
    USER: 'DENY',
    VIEWER: 'DENY',
    redirectTo: '/client',
    redirectToViewer: '/',
  },

  // Client routes — any authenticated except VIEWER.
  // VIEWER → / (single redirect).
  {
    path: '/client/dashboard',
    ADMIN: 'ALLOW',
    USER: 'ALLOW',
    VIEWER: 'DENY',
    redirectTo: '/',
  },
  {
    path: '/client/creer-piece',
    finalPath: '/client/dashboard/creer-piece',
    ADMIN: 'ALLOW',
    USER: 'ALLOW',
    VIEWER: 'DENY',
    redirectTo: '/',
  },
  {
    path: '/client/pieces-pretes',
    finalPath: '/client/dashboard/pieces-pretes',
    ADMIN: 'ALLOW',
    USER: 'ALLOW',
    VIEWER: 'DENY',
    redirectTo: '/',
  },
];