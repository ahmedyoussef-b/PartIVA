'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { UploadCloud, Download, Monitor, Apple, Terminal, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Installer = {
  id: string;
  version: string;
  os: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
};

export default function DesktopDownloadsClient({ initialInstallers }: { initialInstallers: Installer[] }) {
  const [installers, setInstallers] = useState(initialInstallers);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const version = prompt('Version (ex: v1.0.0) ?');
    if (!version) return;
    const os = prompt('OS (windows, macos, linux) ?') || 'windows';
    const fileType = file.name.split('.').pop() || 'exe';

    setIsUploading(true);
    const toastId = toast.loading(`Upload de ${file.name}...`);
    try {
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-installer',
        multipart: file.size > 100 * 1024 * 1024,
      });

      const res = await fetch('/api/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          os,
          fileType,
          fileUrl: blob.url,
          fileSize: file.size,
        }),
      });

      if (!res.ok) throw new Error('Échec sauvegarde');
      const newInstaller = await res.json();
      setInstallers((prev) => [newInstaller, ...prev]);
      toast.success('Installateur déployé !', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error('Erreur lors de l\'upload.', { id: toastId });
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} Ko` : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

  const osIcon = (os: string) => {
    switch (os) {
      case 'windows':
        return <Monitor className="w-8 h-8 text-slate-700" />;
      case 'macos':
        return <Apple className="w-8 h-8 text-slate-700" />;
      case 'linux':
        return <Terminal className="w-8 h-8 text-slate-700" />;
      default:
        return <Monitor className="w-8 h-8 text-slate-700" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Téléchargements Desktop</h1>
          <p className="text-slate-500 mt-2">Gérez les installateurs PartIVA Desktop pour Windows, macOS et Linux.</p>
        </div>
        <div>
          <input
            type="file"
            id="installer-upload"
            className="hidden"
            onChange={handleUpload}
            accept=".exe,.msi,.dmg,.deb,.AppImage"
            disabled={isUploading}
          />
          <label
            htmlFor="installer-upload"
            className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
            {isUploading ? 'Déploiement...' : 'Déployer un installateur'}
          </label>
        </div>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {installers.length === 0 ? (
          <div className="col-span-full bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
            <Monitor className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900">Aucun installateur disponible</h3>
            <p className="text-slate-500 mt-1">Utilisez le bouton ci-dessus pour déployer votre premier installateur.</p>
          </div>
        ) : (
          installers.map((inst) => (
            <div key={inst.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">{inst.version}</span>
                <span className="text-sm text-slate-500">{formatSize(inst.fileSize)}</span>
              </div>
              <div className="flex items-center mb-6">
                <div className="mr-3">{osIcon(inst.os)}</div>
                <div>
                  <h3 className="font-semibold text-slate-900 capitalize">PartIVA pour {inst.os}</h3>
                  <p className="text-sm text-slate-500">.{inst.fileType}</p>
                </div>
              </div>
              <a href={`${inst.fileUrl}?download=1`} className="mt-auto w-full flex items-center justify-center px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition">
                <Download className="w-4 h-4 mr-2" /> Télécharger
              </a>
            </div>
          ))
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex items-start">
        <Info className="w-6 h-6 text-blue-600 mr-4 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Informations de sécurité</h3>
          <p className="text-sm text-blue-800 mt-1">
            Windows : un avertissement SmartScreen peut apparaître lors de la première exécution car l&apos;application n&apos;est pas encore signée avec un certificat de confiance.
          </p>
        </div>
      </div>
    </div>
  );
}
