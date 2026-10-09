'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getAttachmentKindLabel } from '@/lib/enum-labels';
import type { AttachmentKind, FileType } from '@/generated/prisma/browser';

export interface PartAttachmentItem {
  id: string;
  name: string;
  url: string;
  fileType: FileType;
  mimeType: string;
  kind: AttachmentKind;
  sizeBytes: number | null;
  createdAt: string;
}

interface PartAttachmentListProps {
  partId: string;
  initialAttachments: PartAttachmentItem[];
}

function formatBytes(bytes: number | null) {
  if (bytes === null) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function PartAttachmentList({ partId, initialAttachments }: PartAttachmentListProps) {
  const [attachments, setAttachments] = React.useState<PartAttachmentItem[]>(initialAttachments);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    fileType: 'PDF' as FileType,
    kind: 'DOCUMENT' as AttachmentKind,
    data: '',
  });
  const [submitting, setSubmitting] = React.useState(false);

  function openCreate() {
    setForm({ name: '', fileType: 'PDF', kind: 'DOCUMENT', data: '' });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.data.trim()) {
      toast.error('Nom et fichier requis');
      return;
    }

    setSubmitting(true);
    try {
      const mimeType =
        form.fileType === 'PDF'
          ? 'application/pdf'
          : form.fileType === 'CAD_STEP'
            ? 'application/step'
            : form.fileType === 'CAD_STL'
              ? 'model/stl'
              : 'application/obj';

      const res = await fetch(`/api/parts/${partId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          fileType: form.fileType,
          kind: form.kind,
          mimeType,
          data: form.data,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }

      const created = await res.json();
      setAttachments((current) => [...current, created]);
      toast.success('Document ajouté');
      setDialogOpen(false);
      setForm({ name: '', fileType: 'PDF', kind: 'DOCUMENT', data: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(attachment: PartAttachmentItem) {
    if (!window.confirm(`Supprimer le document « ${attachment.name} » ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/parts/${partId}/attachments/${attachment.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      setAttachments((current) => current.filter((a) => a.id !== attachment.id));
      toast.success('Document supprimé');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Documents techniques</CardTitle>
        <CardDescription>
          {attachments.length} document{attachments.length > 1 ? 's' : ''} — fiches techniques,
          modèles CAO, scans 3D.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" className="gap-1 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>

        {attachments.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucun document pour cette pièce.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attachments.map((attachment) => (
                  <TableRow key={attachment.id}>
                    <TableCell className="text-xs font-medium">{attachment.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {attachment.fileType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {getAttachmentKindLabel(attachment.kind)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatBytes(attachment.sizeBytes)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(attachment.createdAt).toLocaleDateString('fr-FR', {
                        dateStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => window.open(attachment.url, '_blank')}
                          aria-label={`Télécharger ${attachment.name}`}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7 w-7 p-0"
                          onClick={() => handleDelete(attachment)}
                          aria-label={`Supprimer ${attachment.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Uploader un document</DialogTitle>
              <DialogDescription>
                Fichier technique (PDF, STEP, STL, OBJ) — base64, 5 Mo max.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="att-name">Nom *</Label>
                <Input
                  id="att-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="fiche-technique.pdf"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="att-filetype">Type de fichier</Label>
                  <select
                    id="att-filetype"
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    value={form.fileType}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        fileType: e.target.value as FileType,
                      }))
                    }
                  >
                    <option value="PDF">PDF</option>
                    <option value="CAD_STEP">CAD STEP</option>
                    <option value="CAD_STL">CAD STL</option>
                    <option value="CAD_OBJ">CAD OBJ</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="att-kind">Catégorie</Label>
                  <select
                    id="att-kind"
                    className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                    value={form.kind}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        kind: e.target.value as AttachmentKind,
                      }))
                    }
                  >
                    <option value="DOCUMENT">Document</option>
                    <option value="CAD">CAO</option>
                    <option value="SCAN">Scan</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-data">Fichier (base64) *</Label>
                <Input
                  id="att-data"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  placeholder="données base64 du fichier…"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '…' : 'Uploader'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
