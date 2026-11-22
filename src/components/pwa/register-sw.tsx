'use client';

import { useEffect, useState } from 'react';

export function RegisterSW() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      // Dev : un SW résiduel (installé lors d'un build/prod antérieur) sert des
      // chunks périmés → erreurs HMR Turbopack et 503 Offline. On le retire.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((reg) =>
            reg.unregister().then(() => console.info('[SW] service worker désenregistré (dev)')),
          );
        })
        .catch((e) => console.warn('[SW] cleanup dev échoué', e));
      if ('caches' in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((e) => console.warn('[SW] registration failed', e));
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
