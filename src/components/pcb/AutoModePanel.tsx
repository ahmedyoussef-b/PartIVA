'use client';

import { useState } from 'react';
import { runAutoPipeline } from '@/lib/pcb/auto-orchestrator';

export function AutoModePanel() {
  const [isAutoRunning, setIsAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState<{ step: string; status: string } | null>(null);

  async function handleAutoMode() {
    setIsAutoRunning(true);
    try {
      const initialData = { projectId: 'auto-session-' + Date.now() };
      await runAutoPipeline(initialData, (step, status) => {
        setAutoProgress({ step, status });
      });
      alert('Pipeline automatique terminé avec succès !');
    } catch (error) {
      console.error('Erreur mode auto:', error);
      alert('Le mode automatique a échoué. Vérifiez la console.');
    } finally {
      setIsAutoRunning(false);
      setAutoProgress(null);
    }
  }

  return (
    <div className="mt-4">
      {isAutoRunning && autoProgress && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">
            Étape en cours : <span className="font-bold">{autoProgress.step}</span> (
            {autoProgress.status})
          </p>
          <div className="mt-2 h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: autoProgress.status === 'success' ? '100%' : '50%' }}
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleAutoMode}
        disabled={isAutoRunning}
        className={`mt-4 rounded-lg px-4 py-2 font-medium transition-colors ${
          isAutoRunning
            ? 'cursor-not-allowed bg-gray-300 text-gray-500'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isAutoRunning ? '⏳ Traitement...' : '🚀 Mode Automatique'}
      </button>
    </div>
  );
}
