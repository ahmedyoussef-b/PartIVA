'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PackageCheck, Truck, CheckCircle2, Download, ShieldCheck, PlusCircle } from 'lucide-react';
import type { PartWithSerializedSuppliers } from '@/lib/data/parts';
import PartImageGallery from '@/components/part-image-gallery';

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
  images: {
    id: string;
    url: string;
    altText: string | null;
    caption: string | null;
    isPrimary: boolean;
  }[];
  metrics: {
    label: string;
    value: string;
  }[];
}

interface PiecesPretesClientProps {
  initialParts: PartWithSerializedSuppliers[];
}

function mapPartToReadyPart(part: PartWithSerializedSuppliers, index: number): ReadyPartItem {
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
    trackingNumber: `TN-EXP-${part.id.slice(-6).toUpperCase()}`,
    carrier: 'Navette Express Atelier PartIVA',
    destination: 'Usine Soliman - Service Maintenance',
    photos: part.images.slice(0, 3).map((img, idx) => ({
      url: img.url,
      title: `${part.name} - Vue ${idx + 1}`,
      desc: part.description || 'Photo de contrôle qualité',
    })),
    images: part.images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      caption: img.caption,
      isPrimary: img.isPrimary,
    })),
    metrics: [
      { label: 'Référence', value: part.partNumber },
      {
        label: 'Statut',
        value:
          status === 'prete'
            ? "Prête à l'envoi"
            : status === 'expediee'
              ? 'Expédiée'
              : 'En transit',
      },
    ],
  };
}

export default function PiecesPretesClient({ initialParts }: PiecesPretesClientProps) {
  const readyParts = React.useMemo(
    () => initialParts.slice(0, 2).map(mapPartToReadyPart),
    [initialParts],
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
          <p className="text-muted-foreground mt-1 text-sm">
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
              <p className="text-muted-foreground text-xs font-medium">
                Pièces prêtes pour expédition
              </p>
              <p className="font-mono text-2xl font-black text-emerald-500">
                {readyParts.length} commandes
              </p>
              <p className="text-muted-foreground text-[11px]">
                {readyParts.reduce((acc, p) => acc + p.quantity, 0)} pièces contrôlées
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">
                Contrôle Métrologie Atelier
              </p>
              <p className="text-primary font-mono text-2xl font-black">100%</p>
              <p className="text-muted-foreground text-[11px]">Conforme ISO 2768-mK</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium">Délai moyen d’expédition</p>
              <p className="font-mono text-2xl font-black text-blue-500">24 h</p>
              <p className="text-muted-foreground text-[11px]">Livraison atelier directe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTE DES PIECES AVEC GALERIE PHOTO */}
      <div className="space-y-8">
        {readyParts.map((part) => (
          <Card key={part.id} className="border-border overflow-hidden shadow-sm">
            {/* Header de la pièce */}
            <CardHeader className="bg-muted/30 border-b p-5">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-xs font-bold">
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
                <PartImageGallery images={part.images} partName={part.name} />
              </div>

              {/* Détails logistiques & Métrologie */}
              <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                {/* Expédition */}
                <div className="bg-muted/20 space-y-2.5 rounded-xl border p-4">
                  <span className="text-foreground flex items-center gap-1.5 text-xs font-bold">
                    <Truck className="text-primary h-4 w-4" />
                    Informations d’Expédition
                  </span>
                  <div className="text-muted-foreground space-y-1.5 text-xs">
                    <p>
                      <strong>Transporteur :</strong> {part.carrier}
                    </p>
                    <p>
                      <strong>N° de Suivi :</strong>{' '}
                      <span className="text-primary font-mono font-bold">
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
                <div className="bg-muted/20 space-y-2.5 rounded-xl border p-4">
                  <span className="text-foreground flex items-center gap-1.5 text-xs font-bold">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Contrôle Qualité & Conformité ISO
                  </span>
                  <div className="text-muted-foreground space-y-1.5 text-xs">
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
    </div>
  );
}
