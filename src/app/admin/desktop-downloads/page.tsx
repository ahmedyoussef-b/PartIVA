'use client';

import { useEffect, useState } from 'react';
import { Download, Monitor, Trash2, Star, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Installer = {
  id: string;
  version: string;
  os: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  isLatest: boolean;
};
type Build = {
  id: string;
  version: string;
  os: string;
  format?: string;
  fileType?: string;
  downloadUrl?: string;
  fileUrl?: string;
  size?: number;
  fileSize?: number;
  isLatest?: boolean;
};



export default function DesktopDownloadsPage() {
  const [installers, setInstallers] = useState<Installer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    const apiUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/desktop-builds`
      : '/api/desktop-builds';

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        const builds = data.builds || [];
        setInstallers(
          builds.map((b: Build) => ({
            id: b.id,
            version: b.version,
            os: b.os,
            fileType: b.format ?? b.fileType ?? '',
            fileUrl: b.downloadUrl ?? b.fileUrl ?? '',
            fileSize: b.size ?? b.fileSize ?? 0,
            isLatest: Boolean(b.isLatest),
          }))
        );
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erreur chargement installateurs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette version ?')) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/desktop-builds/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Échec suppression');
      setInstallers((prev) => prev.filter((i) => i.id !== id));
      toast.success('Version supprimée');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la suppression');
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/desktop-builds/${id}/publish`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Échec publication');
      setInstallers((prev) =>
        prev.map((i) => ({ ...i, isLatest: i.id === id }))
      );
      toast.success('Version définie comme officielle');
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la publication');
    } finally {
      setBusyId(null);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} Ko`
      : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

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
          installers.map((inst) => (
            <div
              key={inst.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  {inst.version}
                </span>
                <span className="text-sm text-slate-500">{formatSize(inst.fileSize)}</span>
              </div>

              {inst.isLatest && (
                <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                  <Crown className="h-3.5 w-3.5" /> Version Officielle
                </div>
              )}

              <div className="mb-6 flex items-center">
                <div className="mr-3">
                  <Monitor className="h-6 w-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 capitalize">
                    PartIVA pour {inst.os}
                  </h3>
                  <p className="text-sm text-slate-500">.{inst.fileType}</p>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2">
                <a
                  href={`${inst.fileUrl}?download=1`}
                  className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-800"
                >
                  <Download className="mr-2 h-4 w-4" /> Télécharger
                </a>

                {!inst.isLatest && (
                  <button
                    onClick={() => handlePublish(inst.id)}
                    disabled={busyId === inst.id}
                    className="flex w-full items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-amber-800 transition hover:bg-amber-100 disabled:opacity-50"
                  >
                    {busyId === inst.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="mr-2 h-4 w-4" />
                    )}
                    Définir comme version officielle
                  </button>
                )}

                <button
                  onClick={() => handleDelete(inst.id)}
                  disabled={busyId === inst.id}
                  className="flex w-full items-center justify-center rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  {busyId === inst.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Supprimer
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
