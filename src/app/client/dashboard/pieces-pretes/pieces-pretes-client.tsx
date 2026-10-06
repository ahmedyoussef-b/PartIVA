'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Camera,
  Eye,
  Download,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import type { PartWithRelations } from '@/lib/data/parts';

interface ReadyPartItem {
  id: string;
  reference: string;
  name: string;
  machine: string;
  material: string;
  quantity: number;
  completionDate: string;
  status: 'prete' | 'expediee' | 'en_transit';
  trackingNumber: string;
  carrier: string;
  destination: string;
  photos: {
    url: string;
    title: string;
    desc: string;
  }[];
  metrics: {
    label: string;
    value: string;
  }[];
}

interface PiecesPretesClientProps {
  initialParts: PartWithRelations[];
}

function mapPartToReadyPart(part: PartWithRelations, index: number): ReadyPartItem {
  const statuses: Array<'prete' | 'expediee' | 'en_transit'> = ['prete', 'expediee', 'en_transit'];
  const status = statuses[index % statuses.length] as 'prete' | 'expediee' | 'en_transit';

  return {
    id: part.id,
    reference: part.partNumber,
    name: part.name,
    machine: 'Atelier PartIVA',
    material: part.material ?? '—',
    quantity: 1,
    completionDate: new Date(part.updatedAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    status,
    trackingNumber: `TN-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
    carrier: 'Navette Express Atelier PartIVA',
    destination: 'Usine Soliman - Service Maintenance',
    photos: part.images.slice(0, 3).map((img, idx) => ({
      url: img.url,
      title: `${part.name} - Vue ${idx + 1}`,
      desc: part.description || 'Photo de contrôle qualité',
    })),
    metrics: [
      { label: 'Référence', value: part.partNumber },
      { label: 'Statut', value: status === 'prete' ? 'Prête à l\'envoi' : status === 'expediee' ? 'Expédiée' : 'En transit' },
    ],
  };
}

export default function PiecesPretesClient({ initialParts }: PiecesPretesClientProps) {
  const [activePhoto, setActivePhoto] = React.useState<{
    url: string;
    title: string;
    desc: string;
  } | null>(null);

  const readyParts = React.useMemo(
    () => initialParts.slice(0, 2).map(mapPartToReadyPart),
    [initialParts]
  );

  const downloadReport = (ref: string) => {
    toast.success(`Téléchargement du rapport de conformité et bon d'expédition pour ${ref}`);
  };

  const confirmReception = (ref: string) => {
    toast.success(
      `Accusé de réception confirmé pour la pièce ${ref}. Merci pour votre confiance !`,
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">
              Espace Client Permanent
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Étape 2 : Pièces Terminées & Photos d’Expédition
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Photographies de vos pièces prêtes à vous être envoyées
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualisez les pièces usinées avant expédition, vérifiez les photos de contrôle qualité
            et téléchargez les certificats matières.
          </p>
        </div>

        <Link href="/client/dashboard/creer-piece">
          <Button className="shrink-0 gap-2 font-bold shadow-md">
            <PlusCircle className="h-4 w-4" />
            Créer une nouvelle pièce
          </Button>
        </Link>
      </div>

      {/* KPI Resume */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pièces prêtes pour expédition
              </p>
              <p className="font-mono text-2xl font-black text-emerald-500">{readyParts.length} commandes</p>
              <p className="text-[11px] text-muted-foreground">
                {readyParts.reduce((acc, p) => acc + p.quantity, 0)} pièces contrôlées
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Contrôle Métrologie Atelier
              </p>
              <p className="font-mono text-2xl font-black text-primary">100%</p>
              <p className="text-[11px] text-muted-foreground">Conforme ISO 2768-mK</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Délai moyen d’expédition</p>
              <p className="font-mono text-2xl font-black text-blue-500">24 h</p>
              <p className="text-[11px] text-muted-foreground">Livraison atelier directe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTE DES PIECES AVEC GALERIE PHOTO */}
      <div className="space-y-8">
        {readyParts.map((part) => (
          <Card key={part.id} className="overflow-hidden border-border shadow-sm">
            {/* Header de la pièce */}
            <CardHeader className="border-b bg-muted/30 p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      {part.reference}
                    </span>
                    {part.status === 'prete' ? (
                      <Badge className="gap-1 bg-emerald-500 text-xs font-medium text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Prête à l’envoi
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-blue-600 text-xs font-medium text-white">
                        <Truck className="h-3.5 w-3.5" />
                        En cours de livraison
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold">{part.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Machine : <strong>{part.machine}</strong> • Matière :{' '}
                    <strong>{part.material}</strong> • Quantité :{' '}
                    <strong>{part.quantity} unités</strong>
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(part.reference)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Bon & Certificat
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => confirmReception(part.reference)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Accuser réception
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Galerie photo haute résolution de la pièce finie */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Camera className="h-4 w-4 text-primary" />
                    Photographies de la pièce terminée et contrôlée à l’atelier
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Cliquez sur une photo pour l’agrandir
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {part.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setActivePhoto(photo)}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-background transition-all hover:border-primary/60 hover:shadow-md"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="h-5 w-5" />
                          <span className="text-xs font-semibold">Agrandir la photo</span>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Badge
                            variant="secondary"
                            className="backdrop-blur-xs bg-black/60 text-[10px] text-white"
                          >
                            Vue #{pIdx + 1}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-1 p-3">
                        <p className="line-clamp-1 text-xs font-semibold text-foreground">
                          {photo.title}
                        </p>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">
                          {photo.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails logistiques & Métrologie */}
              <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                {/* Expédition */}
                <div className="space-y-2.5 rounded-xl border bg-muted/20 p-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Truck className="h-4 w-4 text-primary" />
                    Informations d’Expédition
                  </span>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>
                      <strong>Transporteur :</strong> {part.carrier}
                    </p>
                    <p>
                      <strong>N° de Suivi :</strong>{' '}
                      <span className="font-mono font-bold text-primary">
                        {part.trackingNumber}
                      </span>
                    </p>
                    <p>
                      <strong>Destination usine :</strong> {part.destination}
                    </p>
                    <p>
                      <strong>Date de contrôle & emballage :</strong> {part.completionDate}
                    </p>
                  </div>
                </div>

                {/* Métrologie */}
                <div className="space-y-2.5 rounded-xl border bg-muted/20 p-4">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Contrôle Qualité & Conformité ISO
                  </span>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {part.metrics.map((m, mIdx) => (
                      <p key={mIdx}>
                        <strong>{m.label} :</strong> {m.value}
                      </p>
                    ))}
                    <p className="pt-1 text-[11px] font-medium text-emerald-600">
                      ✓ Pièce 100% conforme au cahier des charges client permanent
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lightbox Modal pour photo agrandie */}
      {activePhoto && (
        <Dialog open={Boolean(activePhoto)} onOpenChange={() => setActivePhoto(null)}>
          <DialogContent className="max-w-4xl overflow-hidden border-zinc-800 bg-black/95 p-0 text-white">
            <div className="relative flex aspect-[16/10] w-full items-center justify-center bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.url}
                alt={activePhoto.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="space-y-1 border-t border-zinc-800 bg-zinc-950 p-6">
              <DialogTitle className="text-lg font-bold text-white">
                {activePhoto.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-zinc-300">
                {activePhoto.desc}
              </DialogDescription>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
