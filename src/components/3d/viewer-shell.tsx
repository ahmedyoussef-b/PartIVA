'use client';

import * as React from 'react';
import { useThree } from '@react-three/fiber';
import { AlertTriangle, Loader2, Maximize, Minimize, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Pont impératif entre la scène Three.js (qui vit dans le `<Canvas>`) et les
 * boutons DOM (qui vivent dans la surcouche HTML). L'objet est transmis par
 * référence : aucune prop `ref` ne franchit la frontière du reconciler R3F.
 */
export interface ViewerBridge {
  reset?: () => void;
}

export const CAMERA_HOME: [number, number, number] = [5, 5, 5];

interface ViewerShellProps {
  bridgeRef: React.RefObject<ViewerBridge>;
  /** Hauteur CSS du viewport 3D (ex: "520px"). `undefined` = hauteur auto. */
  height?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Conteneur clair (fond slate) + boutons flottants Reset / Plein écran.
 * `data-testid="viewer-shell"` pour les assertions E2E.
 */
export function ViewerShell({ bridgeRef, height, className, children }: ViewerShellProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = React.useCallback(() => {
    const element = containerRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void element.requestFullscreen();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="viewer-shell"
      className={cn(
        'border-border relative aspect-video min-h-[320px] w-full overflow-hidden rounded-lg border bg-slate-50',
        className,
      )}
      style={height ? { height } : undefined}
    >
      {children}

      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Reset de la vue"
          title="Reset de la vue"
          className="bg-white/90 shadow-sm backdrop-blur hover:bg-white"
          onClick={() => bridgeRef.current?.reset?.()}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          className="bg-white/90 shadow-sm backdrop-blur hover:bg-white"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/** Voile de chargement affiché par-dessus le canvas. */
export function ViewerLoading({ message = 'Chargement du modèle 3D…' }: { message?: string }) {
  return (
    <div
      data-testid="viewer-loading"
      className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-slate-50/85 text-slate-600"
    >
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

/** Voile d'erreur affiché par-dessus le canvas. */
export function ViewerError({
  message,
  testId = 'viewer-error',
}: {
  message: string;
  testId?: string;
}) {
  return (
    <div
      data-testid={testId}
      className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-2 bg-slate-50/95 p-4 text-center"
    >
      <AlertTriangle className="text-destructive h-6 w-6" />
      <p className="text-destructive text-sm font-medium">Erreur de chargement du modèle 3D</p>
      <p className="text-muted-foreground max-w-[80%] truncate text-xs">{message}</p>
    </div>
  );
}

/**
 * Doit être rendu à l'intérieur du `<Canvas>` : il expose la fonction de reset
 * de la caméra via le `bridgeRef` partagé avec les boutons HTML.
 */
export function ViewerSceneBridge({ bridgeRef }: { bridgeRef: React.RefObject<ViewerBridge> }) {
  const { camera, controls } = useThree();

  React.useEffect(() => {
    bridgeRef.current = {
      reset: () => {
        camera.position.set(...CAMERA_HOME);
        camera.lookAt(0, 0, 0);
        const orbitControls = controls as unknown as { reset?: () => void } | null;
        orbitControls?.reset?.();
      },
    };
    return () => {
      bridgeRef.current = {};
    };
  }, [bridgeRef, camera, controls]);

  return null;
}
