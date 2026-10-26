'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createRequest } from '@/lib/actions/requests';
import {
  Camera,
  CheckCircle2,
  ArrowRight,
  Layers,
  PackageCheck,
  Tag,
  Loader2,
  X,
} from 'lucide-react';

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
  const [photoUrls, setPhotoUrls] = React.useState<string[]>([]);
  const [photoTags, setPhotoTags] = React.useState<{ url: string; tag: string }[]>([]);

  const [partName, setPartName] = React.useState('Pignon d’entraînement chaîne');
  const [machineRef, setMachineRef] = React.useState('Convoyeur Ligne 3 - Remplisseuse');
  const [material, setMaterial] = React.useState('POM-C');
  const [quantity, setQuantity] = React.useState('4');
  const [urgency, setUrgency] = React.useState('normal');
  const [notes, setNotes] = React.useState(
    'Présence d’arrachement de matière sur 3 dents. Merci de respecter le diamètre d’arbre de 25mm avec tolérance H7.',
  );
  const [clientName, setClientName] = React.useState('Client démonstration');
  const [clientEmail, setClientEmail] = React.useState('client@demo.fr');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

  const [uploadState, setUploadState] = React.useState<{
    status: UploadStatus;
    progress: number;
    fileName: string;
  }>({ status: 'idle', progress: 0, fileName: '' });

  const removePhoto = (url: string) => {
    console.log(`${DEBUG_PREFIX} removePhoto: url=${url}`);
    setPhotoUrls((prev) => prev.filter((u) => u !== url));
    setPhotoTags((prev) => prev.filter((p) => p.url !== url));
    toast.info('Photo supprimée.');
  };

  const updateTag = (url: string, newTag: string) => {
    console.log(`${DEBUG_PREFIX} updateTag: url=${url}, newTag=${newTag}`);
    setPhotoTags((prev) => prev.map((p) => (p.url === url ? { ...p, tag: newTag } : p)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (photoUrls.length === 0) {
        console.log(`${DEBUG_PREFIX} ❌ Soumission bloquée: aucune photo`);
        toast.error('Veuillez ajouter au moins une photo de la pièce souhaitée.');
        setIsSubmitting(false);
        return;
      }

      if (!clientName || !clientEmail) {
        console.log(`${DEBUG_PREFIX} ❌ Soumission bloquée: infos client manquantes`);
        toast.error('Veuillez indiquer votre nom et email.');
        setIsSubmitting(false);
        return;
      }

      if (!notes || notes.trim().length < 10) {
        console.log(`${DEBUG_PREFIX} ❌ Soumission bloquée: description trop courte`);
        toast.error('La description doit contenir au moins 10 caractères.');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();

      formData.append('clientName', clientName);
      formData.append('clientEmail', clientEmail);
      formData.append('machineRef', machineRef || '');
      formData.append('partName', partName);
      formData.append('material', material || '');
      formData.append('quantity', quantity || '1');
      formData.append('urgency', urgency || 'normal');
      formData.append('notes', notes || '');

      photoUrls.forEach((url) => formData.append('photos', url));
      photoTags.forEach((t) => formData.append('photoTags', t.tag));

      console.log(`${DEBUG_PREFIX} Appel createRequest avec FormData (photos = URLs Cloudinary)`);
      const res = await createRequest(formData);

      if (!res.success) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Demande envoyée avec succès !');
      router.push('/client/dashboard/demandes');
    } catch (err) {
      console.error(`${DEBUG_PREFIX} Erreur inattendue:`, err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setIsSubmitting(false);
    }
  };

  const uploadFileToCloudinary = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
      if (!uploadPreset || !cloudName) {
        toast.error('Configuration Cloudinary manquante.');
        setUploadState({ status: 'idle', progress: 0, fileName: '' });
        resolve(null);
        return;
      }

      setUploadState({ status: 'uploading', progress: 0, fileName: file.name });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentCompleted = Math.round((event.loaded * 100) / event.total);
          setUploadState((prev) => ({ ...prev, progress: percentCompleted }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          const url = data.secure_url ?? null;
          setUploadState({ status: 'success', progress: 100, fileName: file.name });
          setTimeout(() => setUploadState({ status: 'idle', progress: 0, fileName: '' }), 2000);
          resolve(url);
        } else {
          setUploadState({ status: 'error', progress: 0, fileName: file.name });
          toast.error(`Échec de l'upload de ${file.name}`);
          resolve(null);
        }
      };

      xhr.onerror = () => {
        setUploadState({ status: 'error', progress: 0, fileName: file.name });
        toast.error(`Échec de l'upload de ${file.name}`);
        resolve(null);
      };

      xhr.send(formData);
    });
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const progressToast = toast.loading(`Envoi de ${file.name}...`);

      const url = await uploadFileToCloudinary(file);

      toast.dismiss(progressToast);

      if (url) {
        setPhotoUrls((prev) => [...prev, url]);
        setPhotoTags((prev) => [...prev, { url, tag: 'Vue d’ensemble' }]);
        toast.success(`${file.name} envoyée avec succès`);
      }
    }
    e.target.value = '';
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
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

        <Link href="/client/dashboard/pieces-prêtes">
          <Button variant="outline" className="shrink-0 gap-2">
            <PackageCheck className="h-4 w-4 text-emerald-500" />
            Voir mes pièces prêtes
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
                placeholder="Ex: SARL Meca Precision"
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
                  cotes ou références). Les photos sont uploadées directement vers Cloudinary depuis
                  votre navigateur.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {photoUrls.length} photo{photoUrls.length > 1 ? 's' : ''} chargée
                {photoUrls.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={onFileSelect}
                className="sr-only"
              />
              <label
                htmlFor="photo-upload"
                className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer rounded-md px-4 py-2 font-medium transition-colors"
              >
                Ajouter des photos
              </label>
              {photoUrls.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {photoUrls.length} photo(s) prête(s) à être envoyée(s).
                </p>
              )}
            </div>
            {photoUrls.length > 0 && (
              <p className="text-muted-foreground text-xs">
                {photoUrls.length} photo(s) prête(s) à être envoyée(s).
              </p>
            )}

            {uploadState.status === 'uploading' && (
              <div className="space-y-3">
                <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
                  <span>Upload en cours</span>
                  <span>{uploadState.fileName}</span>
                </div>
                <div className="bg-muted relative w-full overflow-hidden rounded-xl border">
                  <div className="flex h-32 items-center justify-center bg-black/30">
                    <div className="text-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="font-semibold">{uploadState.progress}%</span>
                    </div>
                  </div>
                  <div
                    className="bg-primary absolute top-0 left-0 h-full transition-all duration-100"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>
            )}

            {photoTags.length > 0 && (
              <div className="space-y-3">
                <div className="text-muted-foreground flex items-center justify-between text-xs font-semibold tracking-wider uppercase">
                  <span>Photos prêtes pour l’analyse atelier</span>
                  <span>Précisez l’angle de prise de vue pour chaque photo</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photoTags.map((photo) => (
                    <div
                      key={photo.url}
                      className="group bg-card hover:border-primary/40 relative flex flex-col overflow-hidden rounded-xl border shadow-xs transition-all"
                    >
                      <div className="bg-muted relative aspect-[4/3] w-full overflow-hidden">
<Image
  src={photo.url}
  alt={`Photo ${photo.tag}`}
  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
/>
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.url)}
                          className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white shadow-sm transition-colors hover:bg-rose-600"
                          title="Supprimer la photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>

                        <div className="absolute bottom-2 left-2">
                          <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                            {photo.tag}
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <select
                          value={photo.tag}
                          onChange={(e) => updateTag(photo.url, e.target.value)}
                          className="border-input bg-background focus:ring-primary w-full rounded border px-2 py-1 text-xs"
                        >
                          {PHOTO_TAGS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="text-primary h-5 w-5" />
              2. Informations de la pièce
            </CardTitle>
            <CardDescription>
              Référence machine, matériau, quantité et niveau d’urgence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partName">Nom de la pièce</Label>
                <Input
                  id="partName"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="machineRef">Référence machine</Label>
                <Input
                  id="machineRef"
                  value={machineRef}
                  onChange={(e) => setMachineRef(e.target.value)}
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Matériau</Label>
                <select
                  id="material"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                >
                  {MATERIAL_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Niveau d’urgence</Label>
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="border-input bg-background text-foreground focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
              >
                <option value="low">Faible</option>
                <option value="normal">Délai standard (4-6 jours)</option>
                <option value="high">Urgent (48-72h)</option>
                <option value="critical">Arrêt de production critique (24-48h)</option>
              </select>
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
              disabled={
                isSubmitting || photoUrls.length === 0 || uploadState.status === 'uploading'
              }
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
