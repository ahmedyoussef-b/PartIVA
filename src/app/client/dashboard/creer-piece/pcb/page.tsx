'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createRequest } from '@/lib/actions/requests';
import { Cpu, Tag, ListChecks, Paperclip, ArrowRight, Loader2, X } from 'lucide-react';

const DEBUG_PREFIX = '[DEBUG-CREER-PCB]';

export default function CreerPcbPage() {
  const router = useRouter();

  const [clientName, setClientName] = React.useState('');
  const [clientEmail, setClientEmail] = React.useState('');
  const [projectDescription, setProjectDescription] = React.useState('');
  const [mainFunction, setMainFunction] = React.useState('');
  const [constraints, setConstraints] = React.useState('');
  const [urgency, setUrgency] = React.useState('normal');

  const [fileUrls, setFileUrls] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!clientName?.trim()) errs.clientName = 'Nom / Société obligatoire.';
    if (!clientEmail?.trim()) errs.clientEmail = 'Email obligatoire.';
    if (!projectDescription || projectDescription.trim().length < 10)
      errs.projectDescription = 'La description du projet doit contenir au moins 10 caractères.';
    if (!mainFunction?.trim()) errs.mainFunction = 'La fonction principale est obligatoire.';
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Champs manquants ou invalides', {
        description: Object.values(errs)[0],
        duration: 5000,
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('clientName', clientName);
      formData.append('clientEmail', clientEmail);
      formData.append('machineRef', '');
      formData.append('partName', mainFunction || '');
      formData.append('quantity', '1');
      formData.append('urgency', urgency || 'normal');
      formData.append('type', 'PCB');
      const combinedNotes = constraints?.trim()
        ? `${projectDescription}\n\nContraintes : ${constraints}`
        : projectDescription;
      formData.append('notes', combinedNotes || '');
      fileUrls.forEach((url) => formData.append('photos', url));

      console.info('[CLIENT:FORM] Type sélectionné', { type: 'PCB' });
      console.log(`${DEBUG_PREFIX} Appel createRequest (type=PCB)`);
      const res = await createRequest(formData);

      if (!res.success) {
        setError(res.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Cahier des charges PCB envoyé avec succès !');
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
        resolve(null);
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/upload`);
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url ?? null);
        } else {
          toast.error(`Échec de l'envoi de ${file.name}`);
          resolve(null);
        }
      };
      xhr.onerror = () => {
        toast.error(`Échec de l'envoi de ${file.name}`);
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
        setFileUrls((prev) => [...prev, url]);
        toast.success(`${file.name} envoyé avec succès`);
      }
    }
    e.target.value = '';
  };

  const removeFile = (url: string) => {
    console.log(`${DEBUG_PREFIX} removeFile: url=${url}`);
    setFileUrls((prev) => prev.filter((u) => u !== url));
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
              Étape 1 : Cahier des charges PCB
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Concevoir une carte électronique
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Décrivez votre projet, sa fonction et vos contraintes. Nos ingénieurs électroniques
            prennent le relais.
          </p>
        </div>
        <Link href="/client/dashboard/creer-piece">
          <Button variant="outline" className="shrink-0">← Changer de parcours</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-primary" />
              0. Informations client
            </CardTitle>
            <CardDescription>Vos coordonnées pour identifier la demande.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">
                Nom / Société <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  if (fieldErrors.clientName) setFieldErrors((p) => ({ ...p, clientName: '' }));
                }}
                className={fieldErrors.clientName ? 'border-red-500' : ''}
              />
              {fieldErrors.clientName && (
                <p className="text-xs text-red-500">{fieldErrors.clientName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">
                Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  if (fieldErrors.clientEmail) setFieldErrors((p) => ({ ...p, clientEmail: '' }));
                }}
                className={fieldErrors.clientEmail ? 'border-red-500' : ''}
              />
              {fieldErrors.clientEmail && (
                <p className="text-xs text-red-500">{fieldErrors.clientEmail}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="h-5 w-5 text-primary" />
              1. Votre carte électronique
            </CardTitle>
            <CardDescription>Décrivez le projet, sa fonction et les contraintes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectDescription">
                Description du projet <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="projectDescription"
                rows={4}
                placeholder="Ex : Carte de commande moteur pour convoyeur industriel..."
                value={projectDescription}
                onChange={(e) => {
                  setProjectDescription(e.target.value);
                  if (fieldErrors.projectDescription)
                    setFieldErrors((p) => ({ ...p, projectDescription: '' }));
                }}
                className={fieldErrors.projectDescription ? 'border-red-500' : ''}
              />
              {fieldErrors.projectDescription && (
                <p className="text-xs text-red-500">{fieldErrors.projectDescription}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainFunction">
                Fonction principale <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="mainFunction"
                rows={2}
                placeholder="Ex : Contrôler un moteur pas-à-pas via un signal PWM."
                value={mainFunction}
                onChange={(e) => {
                  setMainFunction(e.target.value);
                  if (fieldErrors.mainFunction)
                    setFieldErrors((p) => ({ ...p, mainFunction: '' }));
                }}
                className={fieldErrors.mainFunction ? 'border-red-500' : ''}
              />
              {fieldErrors.mainFunction && (
                <p className="text-xs text-red-500">{fieldErrors.mainFunction}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="constraints">Contraintes mécaniques (dimensions, connecteurs…)</Label>
              <Textarea
                id="constraints"
                rows={3}
                placeholder="Ex : Dimensions 80x60mm, connecteur Molex 4 broches, fixation par vis M3."
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Niveau d&apos;urgence</Label>
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="low">Faible</option>
                <option value="normal">Délai standard (4-6 jours)</option>
                <option value="high">Urgent (48-72h)</option>
                <option value="critical">Arrêt de production critique (24-48h)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Paperclip className="h-5 w-5 text-primary" />
                2. Fichiers joints (facultatif)
              </CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">
                {fileUrls.length} fichier(s)
              </Badge>
            </div>
            <CardDescription>
              Schémas, photos ou documents utiles (upload vers Cloudinary).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <input
                type="file"
                id="pcb-file-upload"
                multiple
                accept="image/*"
                onChange={onFileSelect}
                className="sr-only"
              />
              <label
                htmlFor="pcb-file-upload"
                className="inline-block cursor-pointer rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Ajouter des fichiers
              </label>
            </div>

            {fileUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {fileUrls.map((url) => (
                  <div key={url} className="group relative overflow-hidden rounded-lg border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Fichier joint" className="h-24 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(url)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-rose-600"
                      title="Supprimer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ListChecks className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">
              Votre cahier des charges sera analysé par notre équipe électronique.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Link href="/client/dashboard/creer-piece">
              <Button type="button" variant="ghost">Annuler</Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2 px-6 font-bold shadow-md sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  Soumettre le cahier des charges
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