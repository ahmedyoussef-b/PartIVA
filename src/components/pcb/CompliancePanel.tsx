'use client';

import { useState } from 'react';

interface Violation {
  type: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  location?: string;
}

interface RealStateAnalysis {
  violations: Violation[];
  isCompliant: boolean;
  checkedRules: number;
}

interface CompliancePanelProps {
  projectId?: string;
  initialResult?: RealStateAnalysis;
}

export default function CompliancePanel({ projectId, initialResult }: CompliancePanelProps) {
  void projectId;
  const [analysis, setAnalysis] = useState<RealStateAnalysis | null>(initialResult ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pcb/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: [], nets: [] }),
      });
      const data = (await res.json()) as RealStateAnalysis;
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold">Conformité Physique</h3>

      {loading && <p className="text-sm text-gray-500">Analyse en cours...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!analysis && !loading && (
        <button
          type="button"
          onClick={runAnalysis}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
        >
          Lancer l&apos;analyse
        </button>
      )}

      {analysis && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className={`rounded px-2 py-1 text-xs font-medium ${
                analysis.isCompliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {analysis.isCompliant ? '✓ Conforme' : '✗ Non conforme'}
            </span>
            <span className="text-xs text-gray-500">{analysis.checkedRules} règles vérifiées</span>
          </div>

          {analysis.violations.length > 0 && (
            <ul className="space-y-2">
              {analysis.violations.map((v, i) => (
                <li
                  key={i}
                  className={`rounded border p-2 text-sm ${
                    v.severity === 'CRITICAL'
                      ? 'border-red-300 bg-red-50'
                      : 'border-amber-300 bg-amber-50'
                  }`}
                >
                  <p className="font-medium">
                    {v.severity === 'CRITICAL' ? '🔴' : '🟡'} {v.type}
                  </p>
                  <p className="text-xs text-gray-600">{v.message}</p>
                  {v.location && <p className="text-xs text-gray-500">📍 {v.location}</p>}
                </li>
              ))}
            </ul>
          )}

          {analysis.violations.length === 0 && (
            <p className="text-sm text-green-600">Aucune violation détectée.</p>
          )}
        </div>
      )}
    </div>
  );
}
