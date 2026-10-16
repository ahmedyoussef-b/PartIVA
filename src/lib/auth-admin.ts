import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export async function requireAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  if (role !== 'ADMIN') {
    throw new Error('Forbidden');
  }

  return session.user;
}
