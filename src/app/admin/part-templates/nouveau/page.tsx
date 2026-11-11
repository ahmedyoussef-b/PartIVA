import { PageHeader } from '@/components/shared/page-header';
import { PartTemplateForm } from './part-template-form';

export default function NewPartTemplatePage() {
  return (
    <div className="max-w-7xl space-y-6">
      <PageHeader
        title="Nouveau template"
        description="Créez un nouveau template de pièce."
        backHref="/admin/part-templates"
      />
      <PartTemplateForm />
    </div>
  );
}
