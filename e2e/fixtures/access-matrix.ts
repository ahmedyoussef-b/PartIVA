/**
 * Access matrix — single source of truth for role-based access.
 * Locked decisions V1–V7 (E0-S07b-1-A audit validation).
 */

import type { Role } from './users';

export type Access = 'ALLOW' | 'DENY' | 'REDIRECT';

export interface RouteAccess {
  path: string;
  ADMIN: Access;
  USER: Access;
  VIEWER: Access;
  redirectTo?: string;
}

export const accessMatrix: RouteAccess[] = [
  { path: '/', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/comment-ca-marche', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/contact', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/demande', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/materiaux', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/services', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/login', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/register', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/forgot-password', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },

  { path: '/admin', ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY', redirectTo: '/client' },
  { path: '/admin/demandes', ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY', redirectTo: '/client' },
  { path: '/admin/reverse-engineering', ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY', redirectTo: '/client' },

  { path: '/client', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY', redirectTo: '/' },
  { path: '/client/dashboard', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY', redirectTo: '/' },
  { path: '/client/creer-piece', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY', redirectTo: '/' },
  { path: '/client/pieces-pretes', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY', redirectTo: '/' },
];