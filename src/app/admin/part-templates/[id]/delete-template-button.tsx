'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deletePartTemplate } from '@/lib/actions/part-templates';
import { toast } from 'sonner';

interface DeleteTemplateButtonProps {
  templateId: string;
}

export function DeleteTemplateButton({ templateId }: DeleteTemplateButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deletePartTemplate(templateId);
    setDeleting(false);
    if (res.success) {
      toast.success('Template supprimé');
      setConfirming(false);
      router.push('/admin/part-templates');
    } else {
      toast.error(res.error ?? 'Erreur lors de la suppression');
    }
  };

  if (!confirming) {
    return (
      <Button variant="destructive" onClick={() => setConfirming(true)} size="sm">
        Supprimer
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Confirmer la suppression ?</p>
      <div className="flex gap-2">
        <Button variant="destructive" onClick={handleDelete} disabled={deleting} size="sm">
          {deleting ? 'Suppression…' : 'Confirmer'}
        </Button>
        <Button variant="outline" onClick={() => setConfirming(false)} size="sm">
          Annuler
        </Button>
      </div>
    </div>
  );
}
