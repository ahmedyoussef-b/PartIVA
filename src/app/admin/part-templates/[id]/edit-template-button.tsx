'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { updatePartTemplate } from '@/lib/actions/part-templates';
import { toast } from 'sonner';

interface EditTemplateButtonProps {
  template: {
    id: string;
    name: string;
    description: string | null;
    material: string | null;
    categoryId: string | null;
    sourceMethod: string | null;
  };
}

export function EditTemplateButton({ template }: EditTemplateButtonProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? '');
  const [material, setMaterial] = useState(template.material ?? '');
  const [categoryId, setCategoryId] = useState(template.categoryId ?? '');
  const [sourceMethod, setSourceMethod] = useState(template.sourceMethod ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await updatePartTemplate({
      id: template.id,
      name,
      description: description || undefined,
      material: material || undefined,
      categoryId: categoryId || undefined,
      sourceMethod: sourceMethod as 'CATALOG' | 'WORKSPACE' | 'REVERSE' | 'IMPORT',
    });
    setSaving(false);
    if (res.success) {
      toast.success('Template mis à jour');
      setEditing(false);
    } else {
      toast.error(res.error ?? 'Erreur');
    }
  };

  if (!editing) {
    return (
      <Button onClick={() => setEditing(true)} size="sm">
        Modifier
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <Input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="Matière" />
      <Input
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        placeholder="Catégorie"
      />
      <Input
        value={sourceMethod}
        onChange={(e) => setSourceMethod(e.target.value)}
        placeholder="Méthode source"
      />
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button variant="outline" onClick={() => setEditing(false)} size="sm">
          Annuler
        </Button>
      </div>
    </div>
  );
}
