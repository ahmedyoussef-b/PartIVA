import { headers } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Box, Download, Ruler, Image as ImageIcon } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getPartById } from '@/lib/data/parts';
import { ModelViewer } from '@/components/3d/model-viewer';
import { PartStatusBadge } from '@/components/part-status-badge';
import PartImageGallery from '@/components/part-image-gallery';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { UserRole } from '@/generated/prisma/client';

export default async function AdminPieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const actorRole = ((session?.user as { role?: string } | undefined)?.role ??
    'VIEWER') as UserRole;

  const part = await getPartById(id);

  if (!part) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-destructive text-2xl font-bold">Pièce introuvable</h1>
          <p className="text-muted-foreground mt-2">
            Aucune pièce ne correspond à l’identifiant <code>{id}</code>.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href="/admin/pieces">Retour au catalogue</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasModel = Boolean(part.printableModelUrl);
  const reference = part.ptvReference ?? part.partNumber;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin/pieces"
            className="text-muted-foreground inline-flex items-center gap-1 text-xs font-medium hover:underline"
          >
            <ArrowLeft className="h-3 w-3" />
            Catalogue pièces
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{part.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-primary font-mono text-sm font-bold">{reference}</span>
            <PartStatusBadge status={part.status} />
            {part.material ? <Badge variant="outline">{part.material}</Badge> : null}
            {part.category ? <Badge variant="secondary">{part.category.name}</Badge> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-secondary text-secondary-foreground rounded px-2 py-1">
            {actorRole}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colonne gauche : visualisation 3D */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="text-sm font-medium">Visualiseur 3D</CardTitle>
              <CardDescription className="text-xs">
                Orbitez, zoomez et déplacez la vue avec la souris. Boutons Reset / Plein écran en
                haut à droite.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {hasModel ? (
                <ModelViewer
                  src={part.printableModelUrl!}
                  alt="Modèle 3D de la pièce"
                  height="520px"
                  bare
                />
              ) : (
                <div className="text-muted-foreground flex aspect-video flex-col items-center justify-center gap-2 text-sm">
                  <Box className="h-8 w-8" />
                  <span>Aucun modèle 3D disponible</span>
                </div>
              )}
            </CardContent>
          </Card>

          {hasModel ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Modèle 3D imprimable</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={part.printableModelUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary inline-flex items-start gap-2 font-mono text-xs break-all hover:underline"
                >
                  <Download className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {part.printableModelUrl}
                </a>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Colonne droite : détails et spécifications */}
        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Images ({part.images?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Détails</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium">Référence PTV</dt>
                      <dd className="font-mono text-sm">{part.ptvReference ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium">
                        N° pièce (legacy)
                      </dt>
                      <dd className="font-mono text-sm">{part.partNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium">Statut</dt>
                      <dd>
                        <PartStatusBadge status={part.status} />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground text-xs font-medium">Matière</dt>
                      <dd className="text-sm">{part.material ?? '—'}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground text-xs font-medium">Description</dt>
                      <dd className="text-sm">{part.description ?? '—'}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {part.specifications.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-medium">
                      <Ruler className="text-muted-foreground h-4 w-4" />
                      Spécifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="divide-border divide-y">
                      {part.specifications.map((spec) => (
                        <div
                          key={spec.id}
                          className="flex items-baseline justify-between gap-4 py-2"
                        >
                          <dt className="text-muted-foreground text-xs font-medium">{spec.key}</dt>
                          <dd className="text-right font-mono text-sm">
                            {spec.value}
                            {spec.unit ? ` ${spec.unit}` : ''}
                            {spec.toleranceMin !== null || spec.toleranceMax !== null ? (
                              <span className="text-muted-foreground ml-1 text-[11px]">
                                {spec.toleranceMin !== null ? `+${spec.toleranceMin}` : ''}
                                {spec.toleranceMax !== null ? ` / ${spec.toleranceMax}` : ''}
                              </span>
                            ) : null}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              ) : null}

              {part.suppliers.length > 0 ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Fournisseurs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-border divide-y">
                      {part.suppliers.map((supplier) => (
                        <li
                          key={supplier.id}
                          className="flex items-baseline justify-between gap-4 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{supplier.supplier.name}</p>
                            <p className="text-muted-foreground font-mono text-[11px]">
                              {supplier.supplier.code}
                              {supplier.supplierRef ? ` · ${supplier.supplierRef}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm">
                              {supplier.price ?? '—'} {supplier.currency}
                            </p>
                            {supplier.leadTimeDays !== null ? (
                              <p className="text-muted-foreground text-[11px]">
                                {supplier.leadTimeDays} j
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="images" className="mt-4">
              <PartImageGallery images={part.images || []} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}







export function generateStaticParams() { return []; }

