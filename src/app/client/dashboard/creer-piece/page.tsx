'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  UploadCloud,
  X,
  Camera,
  CheckCircle2,
  ArrowRight,
  Layers,
  PackageCheck,
  Tag,
} from 'lucide-react';

interface UploadedPhoto {
  id: string;
  url: string;
  name: string;
  size: string;
  tag: string;
}

const PHOTO_TAGS = [
  'Vue d’ensemble',
  'Zone d’usure / rupture',
  'Profil / Épaisseur',
  'Cotes mesurées',
  'Plaque machine',
  'Autre',
];

const MATERIAL_OPTIONS = [
  { value: 'POM-C', label: 'POM-C (Acétal / Delrin) - Précision & Frottement' },
  { value: 'UHMW-PE', label: 'UHMW-PE (PE1000) - Glissement & Anti-abrasion' },
  { value: 'PTFE', label: 'PTFE (Téflon) - Haute température (-200°C à +260°C)' },
  { value: 'PA6', label: 'PA6 / PA66 (Nylon) - Résistance mécanique & Chocs' },
  { value: 'PEEK', label: 'PEEK - Performance extrême' },
  { value: 'INCONNU', label: 'À déterminer par nos ingénieurs méthodes' },
];

export default function CreerPiecePage() {
  const router = useRouter();
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
  ]);

  const [partName, setPartName] = React.useState('Pignon d’entraînement chaîne');
  const [machineRef, setMachineRef] = React.useState('Convoyeur Ligne 3 - Remplisseuse');
  const [material, setMaterial] = React.useState('POM-C');
  const [quantity, setQuantity] = React.useState('4');
  const [urgency, setUrgency] = React.useState('urgent');
  const [notes, setNotes] = React.useState(
    'Présence d’arrachement de matière sur 3 dents. Merci de respecter le diamètre d’arbre de 25mm avec tolérance H7.',
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const newItems: UploadedPhoto[] = acceptedFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tag: 'Vue d’ensemble',
    }));

    setPhotos((prev) => [...prev, ...newItems]);
    toast.success(`${acceptedFiles.length} photo(s) ajoutée(s) avec succès.`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true,
  });

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.info('Photo supprimée.');
  };

  const updateTag = (id: string, newTag: string) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, tag: newTag } : p)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (photos.length === 0) {
      toast.error('Veuillez ajouter au moins une photo de la pièce souhaitée.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success('Votre demande avec photos a été transmise à notre atelier CNC !');
      router.push('/client/dashboard');
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Espace Client Permanent
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Étape 1 : Demande & Dépôt Photos
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Créer une nouvelle pièce à fabriquer
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploadez autant de photos que vous le souhaitez de la pièce cassée ou usée. Nos régleurs
            se chargent de la rétro-ingénierie et de l’usinage.
          </p>
        </div>

        <Link href="/client/dashboard/pieces-pretes">
          <Button variant="outline" className="shrink-0 gap-2">
            <PackageCheck className="h-4 w-4 text-emerald-500" />
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
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-primary" />
                  1. Photographies de la pièce souhaitée
                </CardTitle>
                <CardDescription>
                  Ajoutez autant de photos que nécessaire (face, profil, zone de rupture, macro sur
                  cotes ou références).
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {photos.length} photo{photos.length > 1 ? 's' : ''} chargée
                {photos.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
                isDragActive
                  ? 'scale-[1.005] border-primary bg-primary/5'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="shadow-xs flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Glissez-déposez vos photos ici, ou{' '}
                    <span className="text-primary underline">parcourez vos fichiers</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Nombre illimité de photos • Formats JPG, PNG, WEBP acceptés jusqu’à 15 Mo par
                    image
                  </p>
                </div>
              </div>
            </div>

            {/* Galerie des photos chargées */}
            {photos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Photos prêtes pour l’analyse atelier</span>
                  <span>Précisez l’angle de prise de vue pour chaque photo</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="shadow-xs group relative flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:border-primary/40"
                    >
                      {/* Image Thumbnail */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white shadow-sm transition-colors hover:bg-rose-600"
                          title="Supprimer la photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="absolute bottom-2 left-2">
                          <span className="backdrop-blur-xs rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white">
                            {photo.size}
                          </span>
                        </div>
                      </div>

                      {/* Tag selector */}
                      <div className="flex flex-1 flex-col justify-between space-y-2 p-3">
                        <div
                          className="truncate text-xs font-medium text-foreground"
                          title={photo.name}
                        >
                          {photo.name}
                        </div>

                        <div className="space-y-1">
                          <Label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Tag className="h-3 w-3 text-primary" /> Angle / Vue :
                          </Label>
                          <select
                            value={photo.tag}
                            onChange={(e) => updateTag(photo.id, e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-primary" />
              2. Caractéristiques & Spécifications de la pièce
            </CardTitle>
            <CardDescription>
              Donnez à nos techniciens les éléments essentiels pour préparer le programme d’usinage
              CNC.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="material">Matière plastique souhaitée</Label>
                <select
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Engagement Atelier PartIVA pour les clients permanents
              </p>
              <p className="text-xs text-muted-foreground">
                Prise en charge prioritaire • Rétro-conception CAO sous 4h • Validation avant
                usinage
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Link href="/client/dashboard">
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 px-6 font-bold shadow-md sm:w-auto"
            >
              {isSubmitting ? (
                'Transmission en cours...'
              ) : (
                <>
                  Envoyer la demande de refabrication
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
