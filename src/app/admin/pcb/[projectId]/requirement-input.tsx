'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resolveComponentFromText } from '@/lib/pcb/component-mapping';
import { usePcbEditor } from '@/components/pcb/PcbEditorProvider';

export function RequirementInput() {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const { addNodeAtCenter } = usePcbEditor();

  const submit = () => {
    const resolved = resolveComponentFromText(value);
    if (resolved) {
      addNodeAtCenter(resolved);
      console.info('[PCB:REQ] Exigence soumise', { value, symbolId: resolved.symbolId });
      setValue('');
      setError(null);
    } else {
      console.info('[PCB:REQ] Composant non reconnu', { value });
      setError(`Composant non reconnu : ${value || '(vide)'}`);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 text-sm font-semibold text-gray-700">Exigence</div>
      <div className="flex gap-2">
        <Input
          placeholder="Ex: STM32, résistance, condensateur..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className="text-xs"
        />
        <Button size="sm" onClick={submit}>
          Valider
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}