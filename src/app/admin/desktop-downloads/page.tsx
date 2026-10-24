'use client';

import * as React from 'react';
import { Download, Upload, FileDown, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from '@/lib/auth-client';

interface DesktopBuild {
  id: string;
  version: string;
  os: 'windows' | 'macos' | 'linux' | 'unknown';
  arch: 'x86_64' | 'arm64' | 'unknown';
  format: string;
  filename: string;
  size: number;
  downloadUrl: string;
  checksum?: string;
  publishedAt?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return mb.toFixed(2) + ' Mo';
  const gb = mb / 1024;
  return gb.toFixed(2) + ' Go';
}

function getOsLabel(os: DesktopBuild['os']) {
  switch (os) {
    case 'windows':
      return 'Windows';
    case 'macos':
      return 'macOS';
    case 'linux':
      return 'Linux';
    default:
      return 'Inconnu';
  }
}

function getOsBadgeColor(os: DesktopBuild['os']) {
  switch (os) {
    case 'windows':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
    case 'macos':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/30';
    case 'linux':
      return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function DesktopDownloadsPage() {
  const { data: session } = useSession();
  const [builds, setBuilds] = React.useState<DesktopBuild[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  const fetchBuilds = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/desktop-builds');
      if (!res.ok) {
        throw new Error('Erreur lors du chargement');
      }
      const data = await res.json();
      setBuilds(data.builds || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setBuilds([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/desktop-builds/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      await fetchBuilds();
      e.target.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const latestBuild = builds[0];

  return (
    <div className="container mx-auto max-w-6xl py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-semibold">Téléchargements Desktop</h1>
          <p className="text-muted-foreground text-sm">
            Installeurs PartIVA Desktop pour Windows, macOS et Linux
          </p>
        </div>
        {isAdmin && (
          <div>
            <input
              type="file"
              id="build-upload"
              className="hidden"
              accept=".exe,.msi,.dmg,.AppImage,.zip"
              onChange={handleUpload}
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <label htmlFor="build-upload" className="cursor-pointer gap-2">
                <Upload className="h-4 w-4" />
                {uploading ? 'Upload en cours...' : 'Ajouter un installateur'}
              </label>
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {latestBuild && (
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileDown className="h-5 w-5" />
                  Dernière version
                </CardTitle>
                <CardDescription>Version recommandée pour la plupart des utilisateurs</CardDescription>
              </div>
              <Badge variant="secondary">v{latestBuild.version}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={getOsBadgeColor(latestBuild.os)}>
                {getOsLabel(latestBuild.os)}
              </Badge>
              <span className="text-muted-foreground text-sm">
                {latestBuild.filename} • {formatSize(latestBuild.size)}
              </span>
              {latestBuild.publishedAt && (
                <span className="text-muted-foreground text-sm">
                  Publié le {new Date(latestBuild.publishedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
            <Button asChild>
              <a href={latestBuild.downloadUrl} className="gap-2">
                <Download className="h-4 w-4" />
                Télécharger
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Toutes les versions</CardTitle>
          <CardDescription>Historique des installateurs disponibles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Chargement...</p>
          ) : builds.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun installateur disponible pour le moment.
              {isAdmin && " Utilisez le bouton ci-dessus pour en ajouter un."}
            </p>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left">Version</th>
                    <th className="p-3 text-left">OS</th>
                    <th className="p-3 text-left">Architecture</th>
                    <th className="p-3 text-left">Fichier</th>
                    <th className="p-3 text-left">Taille</th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Checksum</th>
                    <th className="p-3 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {builds.map((build) => (
                    <tr key={build.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">v{build.version}</td>
                      <td className="p-3">
                        <Badge variant="outline" className={getOsBadgeColor(build.os)}>
                          {getOsLabel(build.os)}
                        </Badge>
                      </td>
                      <td className="p-3">{build.arch}</td>
                      <td className="p-3">{build.filename}</td>
                      <td className="p-3">{formatSize(build.size)}</td>
                      <td className="p-3">
                        {build.publishedAt
                          ? new Date(build.publishedAt).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {build.checksum ? `${build.checksum.slice(0, 12)}…` : '-'}
                      </td>
                      <td className="p-3">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={build.downloadUrl} className="gap-2">
                            <Download className="h-3 w-3" />
                            Télécharger
                          </a>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Windows :</strong> Un avertissement SmartScreen peut
              apparaître lors de la première exécution car l&apos;application n&apos;est pas encore
              signée avec un certificat de confiance.
            </p>
          </div>
          <p className="text-muted-foreground text-xs">
            Placez vos installateurs dans le dossier <code>public/builds/</code> ou utilisez le bouton
            d&apos;upload si vous êtes administrateur.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
