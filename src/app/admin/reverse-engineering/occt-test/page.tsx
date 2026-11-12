'use client';

import dynamic from 'next/dynamic';

const OcctPoc = dynamic(() => import('@/components/3d/occt-poc').then((m) => m.OcctPoc), {
  ssr: false,
  loading: () => <div>Chargement...</div>,
});

export default function OcctTestPage() {
  return (
    <div className="p-8">
      <h1>POC OpenCascade.js</h1>
      <OcctPoc />
    </div>
  );
}
