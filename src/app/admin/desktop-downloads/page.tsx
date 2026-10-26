import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import DesktopDownloadsClient from './DesktopDownloadsClient';

export default async function DesktopDownloadsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  const installers = await prisma.desktopInstaller.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <DesktopDownloadsClient
      key={installers.length}
      initialInstallers={
        installers as unknown as {
          id: string;
          version: string;
          os: string;
          fileType: string;
          fileUrl: string;
          fileSize: number;
          createdAt: Date;
        }[]
      }
      isAdmin={isAdmin}
    />
  );
}
