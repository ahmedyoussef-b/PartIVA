'use client';

import { usePathname } from 'next/navigation';

function Badge() {
  const pathname = usePathname();
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA;
  if (!sha) {
    if (process.env.NODE_ENV !== 'production')
      console.warn('CommitBadge: NEXT_PUBLIC_COMMIT_SHA missing');
    return null;
  }
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 4,
        right: 4,
        zIndex: 10,
        fontSize: 10,
        opacity: 0.6,
        pointerEvents: 'none',
        fontFamily: 'monospace',
      }}
    >
      commit {sha.slice(0, 7)} — {pathname}
    </div>
  );
}

export function CommitBadge() {
  if (process.env.NEXT_PUBLIC_SHOW_COMMIT_SHA !== 'true') return null;
  return <Badge />;
}
