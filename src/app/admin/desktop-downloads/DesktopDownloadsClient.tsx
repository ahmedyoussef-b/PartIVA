'use client';

import { useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { UploadCloud, Download, Monitor, Apple, Terminal, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Installer = {
  id: string;
  version: string;
  os: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  createdAt: Date | string;
};

export default function DesktopDownloadsClient({
  initialInstallers,
  isAdmin,
}: {
  initialInstallers: Installer[];
  isAdmin: boolean;
}) {
  const [installers, setInstallers] = useState<Installer[]>(initialInstallers);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [version, setVersion] = useState('');
  const [os, setOs] = useState('windows');
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier.');
      return;
    }
    if (!version) {
      toast.error('Veuillez saisir une version.');
      return;
    }

    const fileType = selectedFile.name.split('.').pop() || 'exe';

    setIsUploading(true);
    const toastId = toast.loading(`Upload de ${selectedFile.name}...`);
    try {
      const blob = await upload(selectedFile.name, selectedFile, {
        access: 'public',
        handleUploadUrl: '/api/desktop-builds/upload',
        multipart: selectedFile.size > 100 * 1024 * 1024,
      });

      const res = await fetch('/api/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version,
          os,
          fileType,
          fileUrl: blob.url,
          fileSize: selectedFile.size,
        }),
      });

      if (!res.ok) throw new Error('Échec sauvegarde');
      const newInstaller = await res.json();
      setInstallers((prev) => [newInstaller, ...prev]);
      setSelectedFile(null);
      setVersion('');
      setOs('windows');
      toast.success('Installateur déployé !', { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error("Erreur lors de l'upload.", { id: toastId });
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} Ko`
      : `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

  const osIcon = (os: string) => {
    switch (os) {
      case 'windows':
        return <Monitor className="h-8 w-8 text-slate-700" />;
      case 'macos':
        return <Apple className="h-8 w-8 text-slate-700" />;
      case 'linux':
        return <Terminal className="h-8 w-8 text-slate-700" />;
      default:
        return <Monitor className="h-8 w-8 text-slate-700" />;
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Téléchargements Desktop</h1>
          <p className="mt-2 text-slate-500">
            Gérez les installateurs PartIVA Desktop pour Windows, macOS et Linux.
          </p>
        </div>
        {isAdmin && (
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isUploading}
                  className="bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                >
                  {isUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                  )}
                  {isUploading ? 'Déploiement...' : 'Déployer un installateur'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Déployer un installateur</DialogTitle>
                  <DialogDescription>
                    Choisissez le fichier, la version et le système d’exploitation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="installer-version">Version</Label>
                    <Input
                      id="installer-version"
                      type="text"
                      placeholder="ex: v1.0.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="installer-os">Système d’exploitation</Label>
                    <Select
                      value={os}
                      onValueChange={(value) => setOs(value as string)}
                      disabled={isUploading}
                    >
                      <SelectTrigger id="installer-os">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="windows">Windows</SelectItem>
                        <SelectItem value="macos">macOS</SelectItem>
                        <SelectItem value="linux">Linux</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="installer-file">Fichier</Label>
                    <input
                      id="installer-file"
                      type="file"
                      accept=".exe,.msi,.dmg,.deb,.AppImage"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setVersion('');
                      setOs('windows');
                    }}
                    disabled={isUploading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleConfirmUpload}
                    disabled={isUploading || !selectedFile || !version}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UploadCloud className="mr-2 h-4 w-4" />
                    )}
                    Confirmer l’upload
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {installers.length === 0 ? (
          <div className="col-span-full rounded-xl border border-slate-200 bg-slate-50 p-12 text-center">
            <Monitor className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900">Aucun installateur disponible</h3>
            <p className="mt-1 text-slate-500">
              Utilisez le bouton ci-dessus pour déployer votre premier installateur.
            </p>
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
              <div className="mb-6 flex items-center">
                <div className="mr-3">{osIcon(inst.os)}</div>
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

      {/* Info box */}
      <div className="flex items-start rounded-xl border border-blue-200 bg-blue-50 p-6">
        <Info className="mt-0.5 mr-4 h-6 w-6 flex-shrink-0 text-blue-600" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Stockage des installateurs</h3>
          <p className="mt-1 text-sm text-blue-800">
            Les installateurs sont stockés de manière sécurisée sur le cloud (Vercel Blob). Utilisez
            le bouton ci-dessus pour déployer une nouvelle version.
          </p>
        </div>
      </div>
    </div>
  );
}
