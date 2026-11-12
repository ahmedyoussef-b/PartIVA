'use client';

import dynamic from 'next/dynamic';

const OcctPoc = dynamic(
  () => import('@/components/3d/occt-poc').then((m) => m.OcctPoc),
  { ssr: false, loading: () => <div>Chargement OpenCascade.js...</div> },
);

export default function OcctPocTestPage() {
  return (
    <div className="p-8">
      <h1>POC OpenCascade.js (public)</h1>
      <p>Cette page teste l&apos;extraction OCCT &rarr; Three.js.</p>
      <OcctPoc />
    </div>
  );
}