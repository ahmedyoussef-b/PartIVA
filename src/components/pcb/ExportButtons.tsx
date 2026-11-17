'use client';

import { useState } from 'react';

interface ExportButtonsProps {
  projectId: string;
  components: Array<{
    id: string;
    refDes?: string;
    mpn?: string;
    description?: string;
    quantity?: number;
    price?: number;
    footprint?: string;
  }>;
}

export default function ExportButtons({ projectId, components }: ExportButtonsProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = (buffer: ArrayBuffer, filename: string, contentType: string) => {
    const blob = new Blob([buffer], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportBom = async () => {
    setExporting('bom');
    setError(null);
    try {
      const res = await fetch('/api/pcb/export/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          components,
          format: 'xlsx',
          includePricing: true,
          includeFootprints: true,
        }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);

      const buffer = await res.arrayBuffer();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(
        buffer,
        `BOM-${dateStr}.xlsx`,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec export BOM');
    } finally {
      setExporting(null);
    }
  };

  const handleExportGerber = async () => {
    setExporting('gerber');
    setError(null);
    try {
      const res = await fetch('/api/pcb/export/gerber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}: ${res.statusText}`);

      const buffer = await res.arrayBuffer();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(buffer, `GERBER-${projectId}-${dateStr}.zip`, 'application/zip');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec export Gerber');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">Exports Fabrication</h3>

      {error && (
        <div className="rounded border border-red-100 bg-red-50 p-2 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleExportBom}
          disabled={exporting !== null || components.length === 0}
          className="flex items-center justify-center gap-1 rounded bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting === 'bom' ? <>⏳ Export...</> : <>📊 BOM (XLSX)</>}
        </button>

        <button
          onClick={handleExportGerber}
          disabled={exporting !== null}
          className="flex items-center justify-center gap-1 rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exporting === 'gerber' ? <>⏳ Export...</> : <>📁 Gerber (ZIP)</>}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 italic">
        BOM : groupé par MPN avec prix • Gerber : couches simulées + drill
      </p>
    </div>
  );
}
