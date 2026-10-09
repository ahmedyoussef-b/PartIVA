'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PART_STATUS_TRANSITIONS, isTransitionAllowed } from '@/lib/part-status';
import { getPartStatusLabel } from '@/lib/enum-labels';
import { PartStatus, UserRole } from '@/generated/prisma/browser';

interface PartTransitionDialogProps {
  partId: string;
  currentStatus: PartStatus;
  actorRole: UserRole;
}

export function PartTransitionDialog({
  partId,
  currentStatus,
  actorRole,
}: PartTransitionDialogProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<PartStatus | ''>('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const allowedTargets = (PART_STATUS_TRANSITIONS[currentStatus] ?? []).filter((to) =>
    isTransitionAllowed(currentStatus, to, actorRole),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) {
      toast.error('Sélectionnez un état cible');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/parts/${partId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus: target,
          reason: reason.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Erreur ${res.status}`);
      }

      toast.success(
        `Statut mis à jour : ${getPartStatusLabel(currentStatus)} → ${getPartStatusLabel(target as PartStatus)}`,
      );
      setOpen(false);
      setTarget('');
      setReason('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la transition');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Transition
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Changer le statut de la pièce</DialogTitle>
          <DialogDescription>
            Statut actuel : {getPartStatusLabel(currentStatus)}. Sélectionnez le nouveau statut.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="target-status">Statut cible</Label>
            <select
              id="target-status"
              className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              value={target}
              onChange={(e) => setTarget(e.target.value as PartStatus)}
            >
              <option value="" disabled>
                Choisir un statut…
              </option>
              {allowedTargets.map((to) => (
                <option key={to} value={to}>
                  {getPartStatusLabel(to)}
                </option>
              ))}
            </select>
            {allowedTargets.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Aucune transition autorisée depuis cet état pour votre rôle.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transition-reason">Raison (optionnelle)</Label>
            <Textarea
              id="transition-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder="Motif de la transition…"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting || !target}>
              {submitting ? '…' : 'Valider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
