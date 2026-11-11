'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, File, AlertTriangle, ChevronDown, Loader2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { importCad } from '@/lib/actions/import-cad';

const ACCEPT = {
  'application/step': ['.step', '.stp'],
  'model/step': ['.step', '.stp'],
  'application/iges': ['.iges', '.igs'],
  'model/iges': ['.iges', '.igs'],
  'model/stl': ['.stl'],
  'model/obj': ['.obj'],
  'model/3mf': ['.3mf'],
};

const MAX_SIZE = 50 * 1024 * 1024;

type CadFileInfo = {
  id: string;
  name: string;
  url: string;
  fileType: string;
  sizeBytes: number | null;
  createdAt: Date | string;
};

interface ImportCadClientProps {
  requestId: string;
  initialFiles: CadFileInfo[];
  isSequential?: boolean;
}

export default function ImportCadClient({
  requestId,
  initialFiles,
  isSequential = false,
}: ImportCadClientProps) {
  const router = useRouter();
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload/cad', {
          method: 'POST',
          body: formData,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadJson.success) {
          setError(uploadJson.error || "Échec de l'upload");
          return;
        }

        const actionResult = await importCad({
          requestId,
          name: uploadJson.name,
          url: uploadJson.url,
          fileType: uploadJson.fileType,
          sizeBytes: uploadJson.sizeBytes,
        });

        if (!actionResult.success) {
          setError(actionResult.error || "Échec de l'import");
          return;
        }

        router.refresh();
      } catch (err) {
        console.error(err);
        setError((err as Error)?.message || 'Erreur inattendue');
      } finally {
        setUploading(false);
      }
    },
    [requestId, router],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_SIZE,
    multiple: false,
    disabled: uploading,
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'CAD_STEP':
        return 'default';
      case 'CAD_IGES':
        return 'secondary';
      case 'CAD_STL':
        return 'outline';
      case 'CAD_OBJ':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {isSequential && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-600">
                Étape 4/4 — Méthode 4 : Import CAO
              </p>
              <p className="text-xs text-muted-foreground">
                Importez un fichier CAO fourni par le client. C&apos;est la dernière méthode du flux
                séquentiel.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/demandes/${requestId}`}>Revenir à la demande</Link>
            </Button>
          </div>
        </div>
      )}
      <div>
        <Link
          href={`/admin/demandes/${requestId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au dossier {requestId.slice(0, 8)}
        </Link>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Importer un fichier CAO
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Formats supportés : STEP/STP, IGES/IGS, STL, OBJ, 3MF (max 50 MB)
          </p>
        </div>
      </div>

      {/* Dropzone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Upload className="h-4 w-4 text-primary" />
            Déposer ou sélectionner un fichier CAO
          </CardTitle>
          <CardDescription className="text-xs">
            Glissez-déposez un fichier ou cliquez pour parcourir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : uploading
                  ? 'pointer-events-none border-muted/30 bg-muted/30 opacity-60'
                  : 'border-border bg-muted/20 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  uploading ? 'bg-primary/10' : 'bg-muted/30'
                }`}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {uploading
                    ? 'Upload en cours…'
                    : isDragActive
                      ? 'Relâchez pour uploader'
                      : 'Cliquez ou glissez un fichier'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploading
                    ? 'Traitement du fichier…'
                    : "STEP, IGES, STL, OBJ, 3MF • Jusqu'à 50 MB"}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-red-500/50 bg-red-500/10 p-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs"
                onClick={() => setError(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing files list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <File className="h-4 w-4 text-primary" />
            Fichiers CAO liés à cette demande ({initialFiles.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Les fichiers sont stockés sur Cloudinary (dossier partiva/cad)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialFiles.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <File className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm">Aucun fichier CAO pour cette demande</p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialFiles.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant={getFileTypeBadgeVariant(f.fileType)}
                        className="text-[10px] font-normal"
                      >
                        {f.fileType}
                      </Badge>
                      <span>{formatFileSize(f.sizeBytes)}</span>
                      <span>•</span>
                      <span>{formatDate(f.createdAt)}</span>
                    </div>
                  </div>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Télécharger
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
