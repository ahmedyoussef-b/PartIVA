import { Suspense } from 'react';
import { WorkspaceClient } from '@/components/workspace/WorkspaceClient';

export default function WorkspacePage() {
  return (
    <Suspense fallback={null}>
      <WorkspaceClient />
    </Suspense>
  );
}
