export interface RouteAccess {
  path: string;
  finalPath?: string;
  dynamicId?: 'request' | 'requestSearch' | 'requestClient';
  ADMIN: 'ALLOW' | 'DENY';
  USER: 'ALLOW' | 'DENY';
  VIEWER: 'ALLOW' | 'DENY';
  redirectTo?: string;
  redirectToViewer?: string;
}

export const accessMatrix: RouteAccess[] = [
  // ── Routes publiques ────────────────────────────────────
  { path: '/',                  ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/comment-ca-marche', ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/contact',           ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/demande',           ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/materiaux',         ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/services',          ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/login',             ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/register',          ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },
  { path: '/forgot-password',   ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'ALLOW' },

  // ── Routes admin (statiques) ────────────────────────────────────
  {
    path: '/admin/demandes',
    ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY',
    redirectTo: '/client', redirectToViewer: '/',
  },
  {
    path: '/admin/reverse-engineering',
    ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY',
    redirectTo: '/client', redirectToViewer: '/',
  },

  // ── Routes client (statiques) ───────────────────────────────────
  {
    path: '/client/dashboard',
    ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY',
    redirectTo: '/',
  },
  {
    path: '/client/creer-piece',
    finalPath: '/client/dashboard/creer-piece',
    ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY',
    redirectTo: '/',
  },
  {
    path: '/client/pieces-pretes',
    finalPath: '/client/dashboard/pieces-pretes',
    ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY',
    redirectTo: '/',
  },

  // ── Routes dynamiques [id] — Request ────────────────────────────
  {
    path: '/admin/demandes/{id}',
    dynamicId: 'request',
    ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY',
    redirectTo: '/client', redirectToViewer: '/',
  },
  {
    path: '/admin/demandes/{id}/recherche',
    dynamicId: 'requestSearch',
    ADMIN: 'ALLOW', USER: 'DENY', VIEWER: 'DENY',
    redirectTo: '/client', redirectToViewer: '/',
  },
  {
    path: '/client/dashboard/demandes/{id}',
    dynamicId: 'requestClient',
    ADMIN: 'ALLOW', USER: 'ALLOW', VIEWER: 'DENY',
    redirectTo: '/',
  },
];
