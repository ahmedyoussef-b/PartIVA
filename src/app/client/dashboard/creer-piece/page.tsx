'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  UploadCloud,
  X,
  Camera,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  AlertTriangle,
  Info,
  PackageCheck,
  Tag,
} from 'lucide-react'

interface UploadedPhoto {
  id: string
  url: string
  name: string
  size: string
  tag: string
}

const PHOTO_TAGS = [
  'Vue d’ensemble',
  'Zone d’usure / rupture',
  'Profil / Épaisseur',
  'Cotes mesurées',
  'Plaque machine',
  'Autre',
]

const MATERIAL_OPTIONS = [
  { value: 'POM-C', label: 'POM-C (Acétal / Delrin) - Précision & Frottement' },
  { value: 'UHMW-PE', label: 'UHMW-PE (PE1000) - Glissement & Anti-abrasion' },
  { value: 'PTFE', label: 'PTFE (Téflon) - Haute température (-200°C à +260°C)' },
  { value: 'PA6', label: 'PA6 / PA66 (Nylon) - Résistance mécanique & Chocs' },
  { value: 'PEEK', label: 'PEEK - Performance extrême' },
  { value: 'INCONNU', label: 'À déterminer par nos ingénieurs méthodes' },
]

export default function CreerPiecePage() {
  const router = useRouter()
  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([
    {
      id: 'photo-1',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      name: 'pignon_denture_usee.jpg',
      size: '2.4 MB',
      tag: 'Zone d’usure / rupture',
    },
    {
      id: 'photo-2',
      url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      name: 'vue_face_alésage.jpg',
      size: '1.8 MB',
      tag: 'Vue d’ensemble',
    },
  ])

  const [partName, setPartName] = React.useState('Pignon d’entraînement chaîne')
  const [machineRef, setMachineRef] = React.useState('Convoyeur Ligne 3 - Remplisseuse')
  const [material, setMaterial] = React.useState('POM-C')
  const [quantity, setQuantity] = React.useState('4')
  const [urgency, setUrgency] = React.useState('urgent')
  const [notes, setNotes] = React.useState(
    'Présence d’arrachement de matière sur 3 dents. Merci de respecter le diamètre d’arbre de 25mm avec tolérance H7.'
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const newItems: UploadedPhoto[] = acceptedFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tag: 'Vue d’ensemble',
    }))

    setPhotos((prev) => [...prev, ...newItems])
    toast.success(`${acceptedFiles.length} photo(s) ajoutée(s) avec succès.`)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
  })

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
    toast.info('Photo supprimée.')
  }

  const updateTag = (id: string, newTag: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, tag: newTag } : p))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (photos.length === 0) {
      toast.error('Veuillez ajouter au moins une photo de la pièce souhaitée.')
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast.success(
        'Votre demande avec photos a été transmise à notre atelier CNC !'
      )
      router.push('/client/dashboard')
    }, 1200)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-primary border-primary/30">
              Espace Client Permanent
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Étape 1 : Demande & Dépôt Photos
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Créer une nouvelle pièce à fabriquer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Uploadez autant de photos que vous le souhaitez de la pièce cassée ou usée. Nos régleurs se chargent de la rétro-ingénierie et de l’usinage.
          </p>
        </div>

        <Link href="/client/dashboard/pieces-pretes">
          <Button variant="outline" className="gap-2 shrink-0">
            <PackageCheck className="w-4 h-4 text-emerald-500" />
            Voir mes pièces prêtes
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION 1: ZONE D'UPLOAD PHOTOS MULTIPLES */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  1. Photographies de la pièce souhaitée
                </CardTitle>
                <CardDescription>
                  Ajoutez autant de photos que nécessaire (face, profil, zone de rupture, macro sur cotes ou références).
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {photos.length} photo{photos.length > 1 ? 's' : ''} chargée{photos.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive
                  ? 'border-primary bg-primary/5 scale-[1.005]'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-sm">
                    Glissez-déposez vos photos ici, ou{' '}
                    <span className="text-primary underline">parcourez vos fichiers</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nombre illimité de photos • Formats JPG, PNG, WEBP acceptés jusqu’à 15 Mo par image
                  </p>
                </div>
              </div>
            </div>

            {/* Galerie des photos chargées */}
            {photos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>Photos prêtes pour l’analyse atelier</span>
                  <span>Précisez l’angle de prise de vue pour chaque photo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative rounded-xl border bg-card overflow-hidden shadow-xs hover:border-primary/40 transition-all flex flex-col"
                    >
                      {/* Image Thumbnail */}
                      <div className="aspect-[4/3] w-full bg-muted relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors shadow-sm"
                          title="Supprimer la photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        <div className="absolute bottom-2 left-2">
                          <span className="text-[10px] font-medium bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {photo.size}
                          </span>
                        </div>
                      </div>

                      {/* Tag selector */}
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="truncate text-xs font-medium text-foreground" title={photo.name}>
                          {photo.name}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Tag className="w-3 h-3 text-primary" /> Angle / Vue :
                          </Label>
                          <select
                            value={photo.tag}
                            onChange={(e) => updateTag(photo.id, e.target.value)}
                            className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {PHOTO_TAGS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 2: SPÉCIFICATIONS TECHNIQUES */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              2. Caractéristiques & Spécifications de la pièce
            </CardTitle>
            <CardDescription>
              Donnez à nos techniciens les éléments essentiels pour préparer le programme d’usinage CNC.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="partName">
                  Nom ou référence de la pièce <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="partName"
                  required
                  placeholder="Ex: Pignon conique 24 dents, Bague de guidage..."
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="machineRef">Machine ou ligne industrielle d’origine</Label>
                <Input
                  id="machineRef"
                  placeholder="Ex: Ligne d'embouteillage Krones, Ensacheuse..."
                  value={machineRef}
                  onChange={(e) => setMachineRef(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="material">Matière plastique souhaitée</Label>
                <select
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {MATERIAL_OPTIONS.map((mat) => (
                    <option key={mat.value} value={mat.value}>
                      {mat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantité désirée <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Niveau d’urgence</Label>
                <select
                  id="urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="normal">Délai standard (4-6 jours)</option>
                  <option value="urgent">Urgent (48-72h)</option>
                  <option value="critical">Arrêt de production critique (24-48h)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                Contraintes de fonctionnement, cotes critiques ou remarques
              </Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Ex: Température d'utilisation 80°C, contact avec des produits acides, tolérance serrée sur l’alésage central..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* RECAPITULATIF & SOUMISSION */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Engagement Atelier PartIVA pour les clients permanents
              </p>
              <p className="text-xs text-muted-foreground">
                Prise en charge prioritaire • Rétro-conception CAO sous 4h • Validation avant usinage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/client/dashboard">
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 font-bold shadow-md w-full sm:w-auto px-6"
            >
              {isSubmitting ? (
                'Transmission en cours...'
              ) : (
                <>
                  Envoyer la demande de refabrication
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
