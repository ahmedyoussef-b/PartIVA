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
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export interface PartSpecificationItem {
  id: string;
  key: string;
  value: string;
  unit: string | null;
  toleranceMin: number | null;
  toleranceMax: number | null;
}

interface PartSpecificationTableProps {
  partId: string;
  initialSpecifications: PartSpecificationItem[];
}

export function PartSpecificationTable({
  partId,
  initialSpecifications,
}: PartSpecificationTableProps) {
  const [specs, setSpecs] = React.useState<PartSpecificationItem[]>(initialSpecifications);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PartSpecificationItem | null>(null);
  const [form, setForm] = React.useState({
    key: '',
    value: '',
    unit: '',
    toleranceMin: '',
    toleranceMax: '',
  });
  const [submitting, setSubmitting] = React.useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ key: '', value: '', unit: '', toleranceMin: '', toleranceMax: '' });
    setDialogOpen(true);
  }

  function openEdit(spec: PartSpecificationItem) {
    setEditing(spec);
    setForm({
      key: spec.key,
      value: spec.value,
      unit: spec.unit ?? '',
      toleranceMin: spec.toleranceMin?.toString() ?? '',
      toleranceMax: spec.toleranceMax?.toString() ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.key.trim() || !form.value.trim()) {
      toast.error('Clé et valeur requises');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        key: form.key.trim(),
        value: form.value.trim(),
        unit: form.unit.trim() || null,
        toleranceMin: form.toleranceMin.trim() ? Number(form.toleranceMin) : null,
        toleranceMax: form.toleranceMax.trim() ? Number(form.toleranceMax) : null,
      };

      if (editing) {
        const res = await fetch(`/api/parts/${partId}/specifications/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Erreur ${res.status}`);
        }
        const updated = await res.json();
        setSpecs((current) => current.map((s) => (s.id === editing.id ? updated : s)));
        toast.success('Spécification mise à jour');
      } else {
        const res = await fetch(`/api/parts/${partId}/specifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || `Erreur ${res.status}`);
        }
        const created = await res.json();
        setSpecs((current) => [...current, created]);
        toast.success('Spécification ajoutée');
      }

      setDialogOpen(false);
      setForm({ key: '', value: '', unit: '', toleranceMin: '', toleranceMax: '' });
      setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(spec: PartSpecificationItem) {
    if (!window.confirm(`Supprimer la spécification « ${spec.key} » ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/parts/${partId}/specifications/${spec.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }
      setSpecs((current) => current.filter((s) => s.id !== spec.id));
      toast.success('Spécification supprimée');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mesures & spécifications</CardTitle>
        <CardDescription>
          {specs.length} spécification{specs.length > 1 ? 's' : ''} — dimensions, tolérances,
          matière.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" className="gap-1 text-xs" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </Button>
        </div>

        {specs.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune spécification pour cette pièce.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clé</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead>Unité</TableHead>
                  <TableHead>Tolérance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specs.map((spec) => (
                  <TableRow key={spec.id}>
                    <TableCell className="font-mono text-xs font-medium">{spec.key}</TableCell>
                    <TableCell className="text-xs">{spec.value}</TableCell>
                    <TableCell>
                      {spec.unit ? (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {spec.unit}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {spec.toleranceMin !== null || spec.toleranceMax !== null
                        ? `${spec.toleranceMin ?? '…'} – ${spec.toleranceMax ?? '…'}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openEdit(spec)}
                          aria-label={`Modifier ${spec.key}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-7 w-7 p-0"
                          onClick={() => handleDelete(spec)}
                          aria-label={`Supprimer ${spec.key}`}
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
              <DialogTitle>
                {editing ? 'Modifier la spécification' : 'Ajouter une spécification'}
              </DialogTitle>
              <DialogDescription>
                Clé technique (ex : diameter_ext), valeur, unité et tolérances optionnelles.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="spec-key">Clé *</Label>
                <Input
                  id="spec-key"
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="diameter_ext"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spec-value">Valeur *</Label>
                <Input
                  id="spec-value"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="52"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="spec-unit">Unité</Label>
                  <Input
                    id="spec-unit"
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="mm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spec-tmin">Tol. min</Label>
                  <Input
                    id="spec-tmin"
                    type="number"
                    step="any"
                    value={form.toleranceMin}
                    onChange={(e) => setForm((f) => ({ ...f, toleranceMin: e.target.value }))}
                    placeholder="51.95"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="spec-tmax">Tol. max</Label>
                  <Input
                    id="spec-tmax"
                    type="number"
                    step="any"
                    value={form.toleranceMax}
                    onChange={(e) => setForm((f) => ({ ...f, toleranceMax: e.target.value }))}
                    placeholder="52.05"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '…' : editing ? 'Valider' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
