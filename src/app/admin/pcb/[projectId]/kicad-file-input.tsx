'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function KicadFileInput({
  projectId,
  current,
}: {
  projectId: string;
  current: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/pcb/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kicadFilePath: value.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Erreur');
        return;
      }

      toast.success('Fichier KiCad enregistré');
      setExists(data.exists);
      router.refresh();
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 w-[420px] text-xs"
        placeholder="C:\...\carte.kicad_pcb"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button size="sm" disabled={saving || value.trim() === ''} onClick={handleSave}>
        Enregistrer
      </Button>
      {exists === true && <span className="text-xs text-green-600">fichier trouvé</span>}
      {exists === false && (
        <span className="text-xs text-orange-500">fichier introuvable sur le serveur</span>
      )}
    </div>
  );
}
