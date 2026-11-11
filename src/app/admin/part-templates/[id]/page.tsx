import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updatePartTemplate, deletePartTemplate } from '@/lib/actions/part-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPartTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ?? 'VIEWER') as string;

  const template = await prisma.partTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    notFound();
  }

  async function handleUpdate(formData: FormData) {
    const result = await updatePartTemplate({
      id,
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      categoryId: (formData.get('categoryId') as string) || undefined,
      material: (formData.get('material') as string) || undefined,
      sourceMethod: ((formData.get('sourceMethod') as string) || undefined) as
        'CATALOG' | 'WORKSPACE' | 'REVERSE' | 'IMPORT' | undefined,
      printableModelUrl: (formData.get('printableModelUrl') as string) || undefined,
    });
    if (!result.success) {
      return;
    }
    redirect(`/admin/part-templates/${id}`);
  }

  async function handleDelete(formData: FormData) {
    await deletePartTemplate(formData.get('id') as string);
    redirect('/admin/part-templates');
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/part-templates"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:underline"
        >
          Liste des templates
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Éditer le template</h1>
        <span className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
          {actorRole}
        </span>
      </div>
      <Card className="max-w-2xl">
        <form action={handleUpdate} id="update-form">
          <input type="hidden" name="id" value={template.id} />
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nom</Label>
              <Input id="name" name="name" required defaultValue={template.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={template.description ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="material">Matière</Label>
              <Input id="material" name="material" defaultValue={template.material ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Catégorie</Label>
              <Input id="categoryId" name="categoryId" defaultValue={template.categoryId ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceMethod">Méthode source</Label>
              <Input
                id="sourceMethod"
                name="sourceMethod"
                defaultValue={template.sourceMethod ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="printableModelUrl">Modèle CAO (URL)</Label>
              <Input
                id="printableModelUrl"
                name="printableModelUrl"
                type="url"
                defaultValue={template.printableModelUrl ?? ''}
              />
            </div>
          </CardContent>
        </form>
        <CardFooter className="flex justify-end gap-2">
          <Link href="/admin/part-templates" className="inline-block">
            <Button variant="outline">Annuler</Button>
          </Link>
          <form action={handleDelete} className="inline">
            <input type="hidden" name="id" value={template.id} />
            <Button variant="destructive" type="submit">
              Supprimer
            </Button>
          </form>
          <Button form="update-form" type="submit">
            Enregistrer
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
