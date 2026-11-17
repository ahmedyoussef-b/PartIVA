'use client';

import { useState } from 'react';

type Severity = 'BLOCKER' | 'MAJOR' | 'MINOR' | 'INFO';

interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  location?: string;
  suggestion?: string;
}

interface DesignReviewReport {
  findings: Finding[];
  summary: { blocker: number; major: number; minor: number; info: number; total: number };
  isPassable: boolean;
  checkedRules: number;
}

interface DesignReviewPanelProps {
  projectId?: string;
  initialReport?: DesignReviewReport;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  BLOCKER: 'bg-red-100 text-red-900 border-red-300',
  MAJOR: 'bg-orange-100 text-orange-900 border-orange-300',
  MINOR: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  INFO: 'bg-blue-100 text-blue-900 border-blue-300',
};

export default function DesignReviewPanel({ projectId, initialReport }: DesignReviewPanelProps) {
  void projectId;
  const [report, setReport] = useState<DesignReviewReport | null>(initialReport ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runReview() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pcb/design-review/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: [], nets: [] }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      const data = (await res.json()) as DesignReviewReport;
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la revue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-800">Revue de Conception</h3>
        <button
          type="button"
          onClick={runReview}
          disabled={loading}
          className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Analyse...' : 'Lancer la revue'}
        </button>
      </div>

      <div className="space-y-4 p-4">
        {error && (
          <div className="rounded border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {!report && !loading && !error && (
          <p className="text-sm text-gray-500 italic">
            Cliquez sur &quot;Lancer la revue&quot; pour vérifier les règles de conception.
          </p>
        )}

        {report && (
          <>
            <div
              className={`flex items-center gap-2 rounded p-3 text-sm font-medium ${
                report.isPassable
                  ? 'border border-green-100 bg-green-50 text-green-800'
                  : 'border border-red-100 bg-red-50 text-red-800'
              }`}
            >
              {report.isPassable ? '✅ Revue validée' : `❌ ${report.summary.blocker} bloqueur(s)`}
              <span className="text-xs opacity-80">
                ({report.checkedRules} règles • {report.summary.total} findings)
              </span>
            </div>

            {(['BLOCKER', 'MAJOR', 'MINOR', 'INFO'] as Severity[]).map((sev) => {
              const sevFindings = report.findings.filter((f) => f.severity === sev);
              if (sevFindings.length === 0) return null;

              return (
                <div key={sev} className="space-y-2">
                  <h4
                    className={`rounded border px-2 py-1 text-xs font-bold tracking-wider uppercase ${SEVERITY_COLORS[sev]}`}
                  >
                    {sev} ({sevFindings.length})
                  </h4>
                  {sevFindings.map((f, i) => (
                    <div key={i} className="space-y-1 rounded border bg-white p-3 text-sm">
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs text-gray-500">{f.ruleId}</span>
                        {f.location && <span className="text-xs text-gray-400">{f.location}</span>}
                      </div>
                      <p className="font-medium text-gray-800">{f.message}</p>
                      {f.suggestion && (
                        <p className="mt-1 text-xs text-indigo-600">💡 {f.suggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
