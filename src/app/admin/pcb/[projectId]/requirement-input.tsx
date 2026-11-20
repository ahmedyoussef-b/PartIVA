'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RequirementInput() {
  const [value, setValue] = React.useState('');

  const submit = () => {
    console.info('[PCB:REQ] Exigence soumise', { value });
    setValue('');
  };

  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 text-sm font-semibold text-gray-700">Exigence</div>
      <div className="flex gap-2">
        <Input
          placeholder="Ex: STM32, Régulateur 3.3V..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          className="text-xs"
        />
        <Button size="sm" onClick={submit}>
          Valider
        </Button>
      </div>
    </div>
  );
}