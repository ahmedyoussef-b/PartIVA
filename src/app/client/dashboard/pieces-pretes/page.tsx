'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  FileCheck2,
  Camera,
  Eye,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  PlusCircle,
  ExternalLink,
  MapPin,
  Clock,
} from 'lucide-react'

interface ReadyPartItem {
  id: string
  reference: string
  name: string
  machine: string
  material: string
  quantity: number
  completionDate: string
  status: 'prete' | 'expediee' | 'en_transit'
  trackingNumber: string
  carrier: string
  destination: string
  photos: {
    url: string
    title: string
    desc: string
  }[]
  metrics: {
    label: string
    value: string
  }[]
}

const READY_PARTS: ReadyPartItem[] = [
  {
    id: 'ready-1',
    reference: 'PL-004812-USINE',
    name: 'Pignon conique hélicoïdal 28 dents',
    machine: 'Ligne TetraPak A3/Flex #02',
    material: 'POM-C (Polyacétal Blanc alimentaire)',
    quantity: 4,
    completionDate: '04 Octobre 2026 - 15:45',
    status: 'prete',
    trackingNumber: 'TN-EXP-847291',
    carrier: 'Navette Express Atelier PartIVA',
    destination: 'Usine Soliman - Service Maintenance',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85',
        title: 'Pièce usinée finie - Sortie Tour CNC Haas',
        desc: 'Finition de denture impeccable, aucune bavure, état de surface Ra 0.8 µm.',
      },
      {
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=85',
        title: 'Contrôle métrologie dimensionnelle',
        desc: 'Alésage central contrôlé à 25.01 mm (tolérance H7 respectée à 100%).',
      },
      {
        url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=85',
        title: 'Conditionnement sous film scellé pour expédition',
        desc: 'Lot de 4 pièces emballées avec protection antichoc et étiquette de traçabilité.',
      },
    ],
    metrics: [
      { label: 'Tolérance mesurée', value: '±0.015 mm (ISO 2768-mK)' },
      { label: 'Dureté matière', value: '82 Shore D conforme' },
      { label: 'Rapport métrologie', value: 'Validé par Métrologue #3' },
    ],
  },
  {
    id: 'ready-2',
    reference: 'PL-004813-USINE',
    name: 'Bague de frottement auto-lubrifiante',
    machine: 'Broche d’entraînement Bobinoir 4',
    material: 'UHMW-PE (PE1000 Vert haute résistance)',
    quantity: 6,
    completionDate: '03 Octobre 2026 - 11:20',
    status: 'en_transit',
    trackingNumber: 'ARX-TN-992144',
    carrier: 'Aramex Logistique Industrielle',
    destination: 'Usine Soliman - Magasin Pièces',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=85',
        title: 'Ensemble des 6 bagues usinées',
        desc: 'Usinage en barre pleine PE1000 avec gorge de lubrification interne.',
      },
      {
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85',
        title: 'Contrôle de concentricité',
        desc: 'Écart de battement < 0.02 mm sur banc de mesure optique.',
      },
    ],
    metrics: [
      { label: 'Coefficient frottement', value: '0.12 (auto-lubrifié)' },
      { label: 'Diamètre extérieur', value: '50.00 mm ±0.02' },
      { label: 'Statut transport', value: 'En cours de livraison' },
    ],
  },
]

export default function PiecesPretesPage() {
  const [activePhoto, setActivePhoto] = React.useState<{
    url: string
    title: string
    desc: string
  } | null>(null)

  const downloadReport = (ref: string) => {
    toast.success(`Téléchargement du rapport de conformité et bon d'expédition pour ${ref}`)
  }

  const confirmReception = (ref: string) => {
    toast.success(`Accusé de réception confirmé pour la pièce ${ref}. Merci pour votre confiance !`)
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
              Espace Client Permanent
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Étape 2 : Pièces Terminées & Photos d’Expédition
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Photographies de vos pièces prêtes à vous être envoyées
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualisez les pièces usinées avant expédition, vérifiez les photos de contrôle qualité et téléchargez les certificats matières.
          </p>
        </div>

        <Link href="/client/dashboard/creer-piece">
          <Button className="gap-2 font-bold shadow-md shrink-0">
            <PlusCircle className="w-4 h-4" />
            Créer une nouvelle pièce
          </Button>
        </Link>
      </div>

      {/* KPI Resume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pièces prêtes pour expédition</p>
              <p className="text-2xl font-black font-mono text-emerald-500">2 commandes</p>
              <p className="text-[11px] text-muted-foreground">10 pièces contrôlées</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Contrôle Métrologie Atelier</p>
              <p className="text-2xl font-black font-mono text-primary">100%</p>
              <p className="text-[11px] text-muted-foreground">Conforme ISO 2768-mK</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Délai moyen d’expédition</p>
              <p className="text-2xl font-black font-mono text-blue-500">24 h</p>
              <p className="text-[11px] text-muted-foreground">Livraison atelier directe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LISTE DES PIECES AVEC GALERIE PHOTO */}
      <div className="space-y-8">
        {READY_PARTS.map((part) => (
          <Card key={part.id} className="border-border shadow-sm overflow-hidden">
            {/* Header de la pièce */}
            <CardHeader className="bg-muted/30 border-b p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                      {part.reference}
                    </span>
                    {part.status === 'prete' ? (
                      <Badge className="bg-emerald-500 text-white font-medium text-xs gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Prête à l’envoi
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-600 text-white font-medium text-xs gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        En cours de livraison
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold">{part.name}</CardTitle>
                  <CardDescription className="text-xs">
                    Machine : <strong>{part.machine}</strong> • Matière : <strong>{part.material}</strong> • Quantité : <strong>{part.quantity} unités</strong>
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(part.reference)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Bon & Certificat
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => confirmReception(part.reference)}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accuser réception
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Galerie photo haute résolution de la pièce finie */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" />
                    Photographies de la pièce terminée et contrôlée à l’atelier
                  </span>
                  <span className="text-xs text-muted-foreground">Cliquez sur une photo pour l’agrandir</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {part.photos.map((photo, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setActivePhoto(photo)}
                      className="group cursor-pointer rounded-xl border bg-background overflow-hidden hover:border-primary/60 hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                          <Eye className="w-5 h-5" />
                          <span className="text-xs font-semibold">Agrandir la photo</span>
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <Badge variant="secondary" className="text-[10px] bg-black/60 text-white backdrop-blur-xs">
                            Vue #{pIdx + 1}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">{photo.title}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{photo.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Détails logistiques & Métrologie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {/* Expédition */}
                <div className="p-4 rounded-xl bg-muted/20 border space-y-2.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-primary" />
                    Informations d’Expédition
                  </span>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>
                      <strong>Transporteur :</strong> {part.carrier}
                    </p>
                    <p>
                      <strong>N° de Suivi :</strong> <span className="font-mono text-primary font-bold">{part.trackingNumber}</span>
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
                <div className="p-4 rounded-xl bg-muted/20 border space-y-2.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Contrôle Qualité & Conformité ISO
                  </span>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {part.metrics.map((m, mIdx) => (
                      <p key={mIdx}>
                        <strong>{m.label} :</strong> {m.value}
                      </p>
                    ))}
                    <p className="text-[11px] text-emerald-600 font-medium pt-1">
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
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 text-white border-zinc-800">
            <div className="relative aspect-[16/10] w-full bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.url}
                alt={activePhoto.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-1">
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
  )
}
