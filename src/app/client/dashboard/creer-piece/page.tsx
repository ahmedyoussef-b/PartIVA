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
import { createRequest } from '@/lib/actions/requests';
import {
  UploadCloud,
  X,
  Camera,
  CheckCircle2,
  ArrowRight,
  Layers,
  PackageCheck,
  Tag,
  Loader2,
} from 'lucide-react';

interface UploadedPhoto {
  id: string;
  url: string;
  file?: File;
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

const DEBUG_PREFIX = '[DEBUG-CREER-PIECE]';

export default function CreerPiecePage() {
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
  const [clientName, setClientName] = React.useState('Client démonstration');
  const [clientEmail, setClientEmail] = React.useState('client@demo.fr');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    console.log(`${DEBUG_PREFIX} Composant monté`);
    console.log(`${DEBUG_PREFIX} État initial:`, {
      photosCount: photos.length,
      partName,
      machineRef,
      material,
      quantity,
      urgency,
      hasNotes: notes.length > 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Exécution unique au montage

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    console.log(`${DEBUG_PREFIX} onDrop: ${acceptedFiles.length} fichier(s) accepté(s)`);
    console.log(
      `${DEBUG_PREFIX} Fichiers:`,
      acceptedFiles.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    );
    const newItems: UploadedPhoto[] = acceptedFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      tag: 'Vue d’ensemble',
      file,
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
    console.log(`${DEBUG_PREFIX} removePhoto: id=${id}`);
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.info('Photo supprimée.');
  };

  const updateTag = (id: string, newTag: string) => {
    console.log(`${DEBUG_PREFIX} updateTag: id=${id}, newTag=${newTag}`);
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, tag: newTag } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log(`${DEBUG_PREFIX} === DÉBUT SOUMISSION RÉELLE ===`);
    e.preventDefault();

    console.log(`${DEBUG_PREFIX} État du formulaire:`, {
      photosCount: photos.length,
      partName,
      machineRef,
      material,
      quantity,
      urgency,
      notesLength: notes.length,
      clientName,
      clientEmail,
    });

    if (photos.length === 0) {
      console.log(`${DEBUG_PREFIX} ❌ Soumission bloquée: aucune photo`);
      toast.error('Veuillez ajouter au moins une photo de la pièce souhaitée.');
      return;
    }

    if (!clientName || !clientEmail) {
      console.log(`${DEBUG_PREFIX} ❌ Soumission bloquée: infos client manquantes`);
      toast.error('Veuillez indiquer votre nom et email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(`${DEBUG_PREFIX} Construction de l'input createRequest...`);

      // Mapping des valeurs d'urgence du formulaire vers les valeurs techniques Zod
      const urgencyMap: Record<string, 'low' | 'normal' | 'high' | 'critical'> = {
        normal: 'normal',
        urgent: 'high',
        critical: 'critical',
        low: 'low',
        high: 'high',
      };
      const mappedUrgency = urgencyMap[urgency] ?? 'normal';

      console.log(`${DEBUG_PREFIX} Mapping urgence:`, {
        original: urgency,
        mapped: mappedUrgency,
      });

      // ÉTAPE 1 : Upload des photos vers Cloudinary
      console.log(
        `${DEBUG_PREFIX} Étape 1: Upload de ${photos.length} photo(s) vers Cloudinary...`,
      );

      const uploadedPhotoUrls: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (!photo) continue;
        console.log(`${DEBUG_PREFIX} Upload photo ${i + 1}/${photos.length}:`, photo.name);

        try {
          // Si la photo a un fichier associé (upload nouveau), l'envoyer à Cloudinary
          if (photo.file) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', photo.file);

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json();
              throw new Error(errorData.error || `Upload échoué: ${uploadResponse.statusText}`);
            }

            const uploadResult = await uploadResponse.json();
            uploadedPhotoUrls.push(uploadResult.url);
            console.log(`${DEBUG_PREFIX} ✅ Photo ${i + 1} uploadée:`, uploadResult.url);
          } else {
            // Photo préexistante (URL externe), utiliser telle quelle
            uploadedPhotoUrls.push(photo.url);
            console.log(`${DEBUG_PREFIX} Photo ${i + 1} déjà externe (URL):`, photo.url);
          }
        } catch (uploadError) {
          console.error(`${DEBUG_PREFIX} ❌ Erreur upload photo ${i + 1}:`, uploadError);
          toast.error(`Échec de l'upload de ${photo.name}: ${(uploadError as Error).message}`);
          throw uploadError;
        }
      }

      console.log(`${DEBUG_PREFIX} ✅ Toutes les photos uploadées:`, uploadedPhotoUrls);

      const input = {
        client: {
          name: clientName,
          email: clientEmail,
        },
        machineRef: machineRef || undefined,
        partDescription: partName,
        partFunction: notes || undefined,
        suspectedMaterial: material,
        quantity: parseInt(quantity, 10) || 1,
        urgency: mappedUrgency,
        photos: uploadedPhotoUrls,
      };

      console.log(`${DEBUG_PREFIX} Appel action serveur createRequest...`);
      const result = await createRequest(input);

      console.log(`${DEBUG_PREFIX} Réponse action serveur:`, {
        success: result.success,
        requestId: result.success ? result.data.id : undefined,
        error: !result.success ? result.error : undefined,
      });

      if (result.success) {
        console.log(`${DEBUG_PREFIX} ✅ Succès - ID demande:`, result.data.id);
        toast.success('Demande soumise avec succès');
        router.push('/client/dashboard');
      } else {
        console.error(`${DEBUG_PREFIX} ❌ Échec:`, result.error);
        setError(result.error || 'Erreur inconnue');
        toast.error(result.error || 'Erreur lors de la soumission');
      }
    } catch (err) {
      console.error(`${DEBUG_PREFIX} 💥 Exception:`, err);
      console.error(`${DEBUG_PREFIX} Stack:`, err instanceof Error ? err.stack : undefined);
      setError(err instanceof Error ? err.message : 'Erreur inattendue');
      toast.error('Erreur inattendue lors de la soumission');
    } finally {
      setIsSubmitting(false);
      console.log(`${DEBUG_PREFIX} === FIN SOUMISSION ===`);
    }
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
          <p className="text-muted-foreground mt-1 text-sm">
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
        {/* SECTION 0: INFORMATIONS CLIENT */}

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="text-primary h-5 w-5" />
              0. Informations client
            </CardTitle>
            <CardDescription>
              Vos coordonnées nous permettent de vous identifier et de créer votre demande.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 space-y-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">
                Nom / Société <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="clientName"
                type="text"
                placeholder="Ex: SARL Méca Precision"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">
                Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="exemple@entreprise.fr"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION 1: ZONE D'UPLOAD PHOTOS MULTIPLES */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="text-primary h-5 w-5" />
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
                  ? 'border-primary bg-primary/5 scale-[1.005]'
                  : 'border-border/80 hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full shadow-xs">
                  <UploadCloud className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    Glissez-déposez vos photos ici, ou{' '}
                    <span className="text-primary underline">parcourez vos fichiers</span>
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Nombre illimité de photos • Formats JPG, PNG, WEBP acceptés jusqu’à 15 Mo par
                    image
                  </p>
                </div>
              </div>
            </div>

            {/* Galerie des photos chargées */}
            {photos.length > 0 && (
              <div className="space-y-3">
                <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
                  <span>Photos prêtes pour l’analyse atelier</span>
                  <span>Précisez l’angle de prise de vue pour chaque photo</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group bg-card hover:border-primary/40 relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-all"
                    >
                      {/* Image Thumbnail */}
                      <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.id)}
                          className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white shadow-sm transition-colors hover:bg-rose-600"
                          title="Supprimer la photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="absolute bottom-2 left-2">
                          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                            {photo.size}
                          </span>
                        </div>
                      </div>

                      {/* Tag selector */}
                      <div className="flex flex-1 flex-col justify-between space-y-2 p-3">
                        <div
                          className="text-foreground truncate text-xs font-medium"
                          title={photo.name}
                        >
                          {photo.name}
                        </div>

                        <div className="space-y-1">
                          <Label className="text-muted-foreground flex items-center gap-1 text-[10px]">
                            <Tag className="text-primary h-3 w-3" /> Angle / Vue :
                          </Label>
                          <select
                            value={photo.tag}
                            onChange={(e) => updateTag(photo.id, e.target.value)}
                            className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-2 py-1.5 text-xs focus:ring-1 focus:outline-none"
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
              <Layers className="text-primary h-5 w-5" />
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
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
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
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
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
        <div className="border-primary/20 bg-primary/5 flex flex-col items-center justify-between gap-4 rounded-xl border p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Engagement Atelier PartIVA pour les clients permanents
              </p>
              <p className="text-muted-foreground text-xs">
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
              disabled={isSubmitting || photos.length === 0}
              className="w-full gap-2 px-6 font-bold shadow-md sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Soumission en cours...
                </>
              ) : (
                <>
                  Soumettre la demande de pièce
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <strong>Erreur :</strong> {error}
          </div>
        )}
      </form>
    </div>
  );
}
