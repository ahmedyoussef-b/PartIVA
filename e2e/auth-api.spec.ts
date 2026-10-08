import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

/**
 * E0-S07b-3-C — BetterAuth API coverage (D47, D50–D54).
 *
 * Project: chromium (no storageState, no setup dependency).
 * Scope: session lifecycle — login OK, login KO, get-session empty,
 * logout with active session + invalidation check.
 * Sign-up / password reset / email verification are OUT OF SCOPE
 * (pollute seed or trigger email side effects).
 *
 * D51: all POST requests include Origin header (BetterAuth 1.7.7 CSRF).
 * D52: sign-out test uses a valid session (option B).
 * D53: assertions on JSON body contracts, not set-cookie parsing.
 * D54: sign-out requires Content-Type: application/json + body {}.
 */

const ORIGIN = 'http://localhost:3000';
const JSON_HEADERS = { Origin: ORIGIN, 'Content-Type': 'application/json' };

test.describe('BetterAuth API — session lifecycle', () => {
  test('POST /api/auth/sign-in/email — valid credentials establish session', async ({ request }) => {
    const res = await request.post('/api/auth/sign-in/email', {
      headers: JSON_HEADERS,
      data: { email: users.ADMIN.email, password: users.ADMIN.password },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(users.ADMIN.email);
    expect(body.user.role).toBe('ADMIN');
    expect(typeof body.token).toBe('string');

    const sessionRes = await request.get('/api/auth/get-session');
    expect(sessionRes.status()).toBe(200);
    const session = await sessionRes.json();
    expect(session).not.toBeNull();
    expect(session.user.email).toBe(users.ADMIN.email);
  });

  test('POST /api/auth/sign-in/email — invalid password returns 401', async ({ request }) => {
    const res = await request.post('/api/auth/sign-in/email', {
      headers: JSON_HEADERS,
      data: { email: users.ADMIN.email, password: 'wrong-password-xyz' },
    });

    expect(res.status()).toBe(401);

    const body = await res.json();
    expect(body.code).toBe('INVALID_EMAIL_OR_PASSWORD');
  });

  test('GET /api/auth/get-session — no cookie returns null session', async ({ request }) => {
    const res = await request.get('/api/auth/get-session');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toBeNull();
  });

  test('POST /api/auth/sign-out — invalidates active session', async ({ request }) => {
    const loginRes = await request.post('/api/auth/sign-in/email', {
      headers: JSON_HEADERS,
      data: { email: users.ADMIN.email, password: users.ADMIN.password },
    });
    expect(loginRes.status()).toBe(200);

    const signOutRes = await request.post('/api/auth/sign-out', {
      headers: JSON_HEADERS,
      data: {},
    });
    expect(signOutRes.status()).toBe(200);

    const signOutBody = await signOutRes.json();
    expect(signOutBody.success).toBe(true);

    const afterRes = await request.get('/api/auth/get-session');
    expect(afterRes.status()).toBe(200);
    const after = await afterRes.json();
    expect(after).toBeNull();
  });
});
