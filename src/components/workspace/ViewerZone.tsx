'use client';

import { useState } from 'react';
import { Ruler, Scissors, Columns, Download } from 'lucide-react';
import { CadViewer } from '@/components/3d/cad-viewer';
import { ModelViewer } from '@/components/3d/model-viewer';
import { downloadStl } from '@/lib/export/stl-export';
import type { ReconstructCandidate } from '@/core/ai-engine/skills/reconstruct/types';
import type { MeasureMode } from '@/components/workspace/MeasureTool';

interface ViewerZoneProps {
  fileUrl?: string | null;
  uploadedFileUrl?: string | null;
  candidates?: ReconstructCandidate[];
  onDimensionsExtracted?: (dimensions: {
    length: number;
    width: number;
    height: number;
    diameter: number;
  }) => void;
}

function isCad(url: string) {
  const ext = url.slice(url.lastIndexOf('.')).toLowerCase();
  return ['.step', '.stp', '.iges', '.igs'].includes(ext);
}

const MODE_LABELS: Record<MeasureMode, string> = {
  distance: 'Distance',
  angle: 'Angle',
  diameter: 'Diamètre',
};

type RenderMode = 'solid' | 'wireframe' | 'xray';

const RENDER_MODE_LABELS: Record<RenderMode, string> = {
  solid: 'Solide',
  wireframe: 'Filaire',
  xray: 'X-Ray',
};

export function ViewerZone({
  fileUrl,
  uploadedFileUrl,
  candidates = [],
  onDimensionsExtracted,
}: ViewerZoneProps) {
  const displayUrl = fileUrl || uploadedFileUrl || null;
  const [measuring, setMeasuring] = useState(false);
  const [measureMode, setMeasureMode] = useState<MeasureMode>('distance');
  const [renderMode, setRenderMode] = useState<RenderMode>('solid');
  const [sectionEnabled, setSectionEnabled] = useState(false);
  const [sectionPosition, setSectionPosition] = useState(0.5);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  if (!displayUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
        <svg
          className="h-10 w-10 text-gray-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
        <p>Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer.</p>
      </div>
    );
  }

  const isCadFile = displayUrl ? isCad(displayUrl) : false;
  const validCandidates = candidates.filter((c) => !!c.fileUrl);
  const selectedCandidate =
    validCandidates.find((c) => c.id === selectedCandidateId) ?? validCandidates[0] ?? null;

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute top-2 right-2 z-50 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setMeasuring((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
            measuring ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          <Ruler className="h-4 w-4" />
          Mesurer
        </button>
        {measuring && (
          <select
            value={measureMode}
            onChange={(e) => setMeasureMode(e.target.value as MeasureMode)}
            className="rounded border bg-white px-2 py-1 text-xs shadow"
          >
            {Object.entries(MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        )}
        <select
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value as RenderMode)}
          className="rounded border bg-white px-2 py-1 text-xs shadow"
          aria-label="Mode de rendu"
        >
          {Object.entries(RENDER_MODE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSectionEnabled((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
            sectionEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          <Scissors className="h-4 w-4" />
          Section
        </button>
        {sectionEnabled && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={sectionPosition}
            onChange={(e) => setSectionPosition(Number(e.target.value))}
            className="w-24"
            aria-label="Position du plan de coupe"
          />
        )}
        {displayUrl &&
          (displayUrl.endsWith('.stl') || displayUrl.startsWith('data:application/stl')) && (
            <button
              type="button"
              onClick={() => downloadStl(displayUrl, 'piece-uploaded-printable.stl')}
              className="flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs shadow"
            >
              <Download className="h-4 w-4" />
              Exporter STL
            </button>
          )}
        <button
          type="button"
          onClick={() => setCompareEnabled((v) => !v)}
          className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs shadow ${
            compareEnabled ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
          }`}
        >
          <Columns className="h-4 w-4" />
          Comparer
        </button>
      </div>
      {compareEnabled ? (
        <div className="grid h-full grid-cols-2 gap-2 p-2">
          <div className="min-h-0">
            {uploadedFileUrl ? (
              isCad(uploadedFileUrl) ? (
                <CadViewer
                  src={uploadedFileUrl}
                  bare
                  height={400}
                  renderMode={renderMode}
                  sectionEnabled={sectionEnabled}
                  sectionPosition={sectionPosition}
                />
              ) : (
                <ModelViewer
                  src={uploadedFileUrl}
                  bare
                  height={400}
                  renderMode={renderMode}
                  sectionEnabled={sectionEnabled}
                  sectionPosition={sectionPosition}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aucun fichier uploadé
              </div>
            )}
          </div>
          <div className="min-h-0">
            <select
              value={selectedCandidate?.id ?? ''}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="mb-1 w-full rounded border bg-white px-2 py-1 text-xs shadow"
            >
              {validCandidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id}
                </option>
              ))}
            </select>
            {selectedCandidate?.fileUrl ? (
              isCad(selectedCandidate.fileUrl) ? (
                <CadViewer
                  src={selectedCandidate.fileUrl}
                  bare
                  height={400}
                  renderMode={renderMode}
                  sectionEnabled={sectionEnabled}
                  sectionPosition={sectionPosition}
                />
              ) : (
                <ModelViewer
                  src={selectedCandidate.fileUrl}
                  bare
                  height={400}
                  renderMode={renderMode}
                  sectionEnabled={sectionEnabled}
                  sectionPosition={sectionPosition}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                Aucun candidat
              </div>
            )}
          </div>
        </div>
      ) : !displayUrl ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-lg border bg-white p-4 text-center text-sm text-gray-500 shadow-sm">
          <p>Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer.</p>
        </div>
      ) : isCadFile ? (
        <CadViewer
          src={displayUrl}
          bare
          height={400}
          measureEnabled={measuring}
          measureMode={measureMode}
          renderMode={renderMode}
          sectionEnabled={sectionEnabled}
          sectionPosition={sectionPosition}
          onDimensionsExtracted={onDimensionsExtracted}
        />
      ) : (
        <ModelViewer
          src={displayUrl}
          bare
          height={400}
          measureEnabled={measuring}
          measureMode={measureMode}
          renderMode={renderMode}
          sectionEnabled={sectionEnabled}
          sectionPosition={sectionPosition}
          onDimensionsExtracted={onDimensionsExtracted}
        />
      )}
    </div>
  );
}
