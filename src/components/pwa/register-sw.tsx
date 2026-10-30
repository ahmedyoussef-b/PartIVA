'use client';

import { useEffect, useState } from 'react';

export function RegisterSW() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="fixed bottom-2 left-2 z-50 rounded-md bg-amber-500 px-3 py-1.5 text-xs text-white shadow">
      Mode hors-ligne
    </div>
  );
}
