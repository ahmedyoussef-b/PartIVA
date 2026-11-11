import { Suspense } from 'react';
import { WorkspaceClient } from '@/components/workspace/WorkspaceClient';

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ sequential?: string; requestId?: string }>;
}) {
  const { sequential } = await searchParams;
  const isSequential = sequential === '1';

  return (
    <Suspense fallback={null}>
      <WorkspaceClient isSequential={isSequential} />
    </Suspense>
  );
}
