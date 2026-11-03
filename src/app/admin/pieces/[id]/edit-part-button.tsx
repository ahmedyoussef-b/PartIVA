'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updatePart } from '@/lib/actions/parts';
import { toast } from 'sonner';

export function EditPartButton({ part }: { part: { id: string; name: string; description: string | null; material: string | null; ptvReference: string | null; partNumber: string } }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(part.name);
  const [description, setDescription] = useState(part.description ?? '');
  const [material, setMaterial] = useState(part.material ?? '');
  const [ptvReference, setPtvReference] = useState(part.ptvReference ?? '');
  const [partNumber, setPartNumber] = useState(part.partNumber);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    console.log('[ADMIN-EDIT-PART] Sauvegarde demandée:', { partId: part.id });
    setSaving(true);
    const res = await updatePart({ partId: part.id, name, description, material, ptvReference, partNumber });
    setSaving(false);
    if (res.success) {
      console.log('[ADMIN-EDIT-PART] Toast succès: "Pièce mise à jour"');
      toast.success('Pièce mise à jour');
      setEditing(false);
    } else {
      console.error('[ADMIN-EDIT-PART-ERROR] Toast erreur:', { message: res.error });
      toast.error(res.error ?? 'Erreur');
    }
  };

  if (!editing) {
    console.log('[ADMIN-EDIT-PART] Mode édition activé:', { partId: part.id });
    return <Button onClick={() => setEditing(true)}>Modifier</Button>;
  }

  return (
    <div className="flex flex-col gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
      <Input value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="N° pièce" />
      <Input value={ptvReference} onChange={(e) => setPtvReference(e.target.value)} placeholder="Réf. PTV" />
      <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Matière" />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Button>
        <Button variant="outline" onClick={() => { console.log('[ADMIN-EDIT-PART] Annulation:', { partId: part.id }); setEditing(false); }}>Annuler</Button>
      </div>
    </div>
  );
}
