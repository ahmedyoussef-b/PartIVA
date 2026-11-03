'use client';

import { useState } from 'react';
import { updatePart } from '@/lib/actions/parts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Part = {
  id: string;
  name: string;
  partNumber: string;
  ptvReference: string | null;
  material: string | null;
  description: string | null;
  status: string;
};

export function PiecesDetailClient({ part }: { part: Part }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(part.name);
  const [material, setMaterial] = useState(part.material ?? '');
  const [description, setDescription] = useState(part.description ?? '');
  const [ptvReference, setPtvReference] = useState(part.ptvReference ?? '');
  const [partNumber, setPartNumber] = useState(part.partNumber);
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    console.log('[ADMIN-EDIT-PART] Mode édition activé:', { partId: part.id, fields: ['name', 'material', 'description', 'ptvReference', 'partNumber'] });
    setEditing(true);
  };

  const handleCancel = () => {
    console.log('[ADMIN-EDIT-PART] Annulation:', { partId: part.id });
    setName(part.name);
    setMaterial(part.material ?? '');
    setDescription(part.description ?? '');
    setPtvReference(part.ptvReference ?? '');
    setPartNumber(part.partNumber);
    setEditing(false);
  };

  const handleSave = async () => {
    const updatedFields = { name, material, description, ptvReference, partNumber };
    console.log('[ADMIN-EDIT-PART] Sauvegarde demandée:', { partId: part.id, updatedFields });
    setSaving(true);
    try {
      const res = await updatePart({
        partId: part.id,
        name,
        material,
        description,
        ptvReference,
        partNumber,
      });
      if (res.success) {
        console.log('[ADMIN-EDIT-PART] Toast succès: "Pièce mise à jour"');
        toast.success('Pièce mise à jour');
        setEditing(false);
      } else {
        console.error('[ADMIN-EDIT-PART-ERROR] Toast erreur:', { message: res.error });
        toast.error(res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={handleEdit}>Modifier</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
      <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="N° pièce" />
      <Input value={ptvReference} onChange={(e) => setPtvReference(e.target.value)} placeholder="Réf. PTV" />
      <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Matière" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>Sauvegarder</Button>
        <Button variant="outline" onClick={handleCancel}>Annuler</Button>
      </div>
    </div>
  );
}
