import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function RequirementInput({
  projectId,
  partFunction,
}: {
  projectId: string;
  partFunction?: string | null;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-2 text-sm font-semibold text-gray-700">Cahier des charges</div>
      <div className="flex gap-2">
        <Input
          placeholder="Cahier des charges envoyé par le client"
          value={partFunction ?? ''}
          readOnly
          className="text-xs"
        />
        <Button size="sm" asChild>
          <Link href={`/admin/pcb/${projectId}/cahier-des-charges`}>Consulter</Link>
        </Button>
      </div>
    </div>
  );
}
