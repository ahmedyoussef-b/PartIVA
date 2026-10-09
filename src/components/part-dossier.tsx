'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartStatusBadge } from '@/components/part-status-badge';
import { PartVersionHistory } from '@/components/part-version-history';
import { PartSpecificationTable } from '@/components/part-specification-table';
import { PartAttachmentList } from '@/components/part-attachment-list';
import type { PartAttachmentItem } from '@/components/part-attachment-list';
import PartImageGallery from '@/components/part-image-gallery';
import { getMaterialCategoryLabel } from '@/lib/enum-labels';
import type { MaterialCategory, PartStatus } from '@/generated/prisma/browser';
import type { PartWithSerializedSuppliers } from '@/lib/data/parts';

interface PartDossierProps {
  part: Omit<PartWithSerializedSuppliers, 'attachments'> & {
    attachments: PartAttachmentItem[];
  };
}

export function PartDossier({ part }: PartDossierProps) {
  const [tab, setTab] = React.useState('dossier');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Dossier pièce — {part.ptvReference}</CardTitle>
          <PartStatusBadge status={part.status as PartStatus} />
        </div>
        <CardDescription>
          Vue centralisée du dossier : informations, mesures, documents, historique et images.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="dossier">Dossier</TabsTrigger>
            <TabsTrigger value="mesures">Mesures</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="historique">Historique</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="dossier" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-semibold">Identification</p>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Réf. PTV</TableCell>
                      <TableCell className="font-mono text-xs">{part.ptvReference}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">N° pièce (legacy)</TableCell>
                      <TableCell className="font-mono text-xs">{part.partNumber}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Nom</TableCell>
                      <TableCell className="text-xs">{part.name}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Matière</TableCell>
                      <TableCell className="text-xs">
                        {part.material
                          ? getMaterialCategoryLabel(part.material as MaterialCategory)
                          : '—'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-semibold">Description</p>
                <p className="text-muted-foreground text-xs">{part.description || '—'}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {part.images.length} image
                    {part.images.length > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {part.specifications.length} mesure
                    {part.specifications.length > 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {part.attachments.length} document
                    {part.attachments.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mesures">
            <PartSpecificationTable partId={part.id} initialSpecifications={part.specifications} />
          </TabsContent>

          <TabsContent value="documents">
            <PartAttachmentList partId={part.id} initialAttachments={part.attachments} />
          </TabsContent>

          <TabsContent value="historique">
            <PartVersionHistory partId={part.id} />
          </TabsContent>

          <TabsContent value="images">
            <PartImageGallery images={part.images} partName={part.name} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
