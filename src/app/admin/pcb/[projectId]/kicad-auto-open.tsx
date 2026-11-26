'use client';

import { useEffect, useRef } from 'react';

export function KicadAutoOpen({
  projectId,
  kicadFilePath,
  hasResult,
}: {
  projectId: string;
  kicadFilePath?: string | null;
  hasResult?: boolean;
}) {
  const done = useRef(false);
  useEffect(() => {
    if (hasResult) return;
    if (done.current) return;
    if (!kicadFilePath?.trim()) return;
    done.current = true;
    fetch(`/api/pcb/projects/${projectId}/board`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'launch', source: 'auto' }),
    }).catch(() => {});
  }, [projectId, kicadFilePath, hasResult]);
  return null;
}
