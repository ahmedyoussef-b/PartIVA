'use client';

import { useEffect, useState } from 'react';
import { Download, Monitor } from 'lucide-react';

type Installer = {
  version: string;
  os: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
};

export default function DesktopDownloadsPage() {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/installers.json')
      .then((res) => res.json())
      .then((data) => {
        setInstallers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Chargement…</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Téléchargements Desktop</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {installers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
            <Monitor className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900">Aucun installateur disponible</h3>
          </div>
        ) : (
          installers.map((inst, i) => (
            <div key={i} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {inst.version}
                </span>
                <span className="text-sm text-slate-500">{inst.fileSize} o</span>
              </div>
              <div className="mb-6 flex items-center">
                <div className="mr-3"><Monitor className="h-6 w-6 text-slate-700" /></div>
                <div>
                  <h3 className="font-semibold text-slate-900 capitalize">
                    PartIVA pour {inst.os}
                  </h3>
                  <p className="text-sm text-slate-500">.{inst.fileType}</p>
                </div>
              </div>
              <a
                href={`${inst.fileUrl}?download=1`}
                className="mt-auto flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
              >
                <Download className="mr-2 h-4 w-4" /> Télécharger
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
