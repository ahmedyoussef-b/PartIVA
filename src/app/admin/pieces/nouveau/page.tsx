import { PageHeader } from '@/components/shared/page-header';
import { PiecesForm } from './pieces-form';

export default function NewPiecePage() {
  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title="Nouvelle pièce"
        description="Créez une nouvelle pièce dans le catalogue."
        backHref="/admin/pieces"
      />
      <PiecesForm />
    </div>
  );
}
