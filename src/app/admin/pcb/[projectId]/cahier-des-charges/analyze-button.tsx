'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface DivergenceView {
  key: string;
  pass1Value: string;
  pass2Value: string;
  reason: string;
}

export function AnalyzeButton({
  projectId,
  hasExisting = false,
}: {
  projectId: string;
  hasExisting?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    doublePass: string;
    divergences: DivergenceView[];
    dropped: number;
  } | null>(null);

  const handleAnalyze = async () => {
    if (loading) return;
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch('/api/pcb/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...(hasExisting ? { force: true } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Erreur lors de l’analyse');
        return;
      }
      toast.success(`${data.count} exigence(s) proposée(s)`);

      setReport({
        doublePass: data.doublePass ?? 'disabled',
        divergences: Array.isArray(data.divergences) ? data.divergences : [],
        dropped:
          (Array.isArray(data.onlyInPass1) ? data.onlyInPass1.length : 0) +
          (Array.isArray(data.onlyInPass2) ? data.onlyInPass2.length : 0),
      });

      router.refresh();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button size="sm" onClick={handleAnalyze} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        {hasExisting ? 'Re-analyser le cahier des charges' : 'Analyser le cahier des charges'}
      </Button>

      {report && report.divergences.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          <p className="font-semibold">
            {report.divergences.length} divergence(s) entre les deux passes
          </p>
          <ul className="mt-1 space-y-0.5">
            {report.divergences.slice(0, 5).map((d) => (
              <li key={`${d.key}-${d.reason}`}>
                {d.key} : {d.pass1Value} vs {d.pass2Value}
              </li>
            ))}
            {report.divergences.length > 5 && <li>…</li>}
          </ul>
        </div>
      )}

      {report && report.dropped > 0 && (
        <p className="text-xs text-gray-500">
          {report.dropped} exigence(s) non confirmée(s) par la seconde passe
        </p>
      )}

      {report && report.doublePass === 'failed' && (
        <p className="text-xs text-gray-500">Seconde passe indisponible</p>
      )}
    </div>
  );
}
