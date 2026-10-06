'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone } from 'react-dropzone';
import { useTransition } from 'react';
import { CreateRequestSchema, type CreateRequest } from '@/schemas/request';
import { MaterialSchema } from '@/schemas/part';
import { FR } from '@/i18n/fr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, UploadCloud, X, CheckCircle2 } from 'lucide-react';
import { createRequest } from '@/lib/actions/requests';

const STEPS = [
  { id: 1, label: 'Client' },
  { id: 2, label: 'Machine' },
  { id: 3, label: 'Pièce' },
  { id: 4, label: 'Photos' },
  { id: 5, label: 'Quantité' },
  { id: 6, label: 'Récap' },
];

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Basse', desc: '7-10 jours ouvrés', color: 'text-blue-600' },
  { value: 'normal', label: 'Normale', desc: '4-6 jours ouvrés', color: 'text-foreground' },
  { value: 'high', label: 'Haute', desc: '48-72h', color: 'text-amber-600' },
  { value: 'critical', label: 'Critique', desc: 'Arrêt de ligne (24h)', color: 'text-rose-600' },
];

export default function DemandePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateRequest>({
    resolver: zodResolver(CreateRequestSchema),
    mode: 'onChange',
    defaultValues: {
      quantity: 1,
      urgency: 'normal',
      photos: [],
      client: { name: '', email: '', company: '', phone: '' },
      machineRef: '',
      partDescription: '',
      partFunction: '',
    },
  });

  const formValues = watch();

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const currentPhotos = formValues.photos || [];
      const newPhotos = [...currentPhotos, ...acceptedFiles].slice(0, 10);
      setValue('photos', newPhotos, { shouldValidate: true });
      const newUrls = acceptedFiles.map((f) => URL.createObjectURL(f));
      setPhotoPreviews((prev) => [...prev, ...newUrls].slice(0, 10));
      toast.success(`${acceptedFiles.length} photo(s) ajoutée(s)`);
    },
    [formValues.photos, setValue],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 10,
    maxSize: 10 * 1024 * 1024,
  });

  const removePhoto = (index: number) => {
    const updated = (formValues.photos || []).filter((_, i) => i !== index);
    setValue('photos', updated, { shouldValidate: true });
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const [isPending, startTransition] = useTransition();

  const onSubmit = async (data: CreateRequest) => {
    startTransition(async () => {
      const payload = {
        client: data.client,
        machineRef: data.machineRef,
        partDescription: data.partDescription,
        partFunction: data.partFunction,
        suspectedMaterial: data.suspectedMaterial,
        quantity: data.quantity,
        urgency: data.urgency,
        photos: photoPreviews.length > 0 ? photoPreviews : [],
      };
      const result = await createRequest(payload);
      if (result.success) {
        toast.success('Demande enregistrée avec succès !');
        router.push(`/demande/confirmation?id=${(result.data as unknown as { id?: string }).id || 'req-new'}`);
      } else {
        toast.error(result.error || 'Échec de la soumission');
      }
    });
  };

  const handleNext = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await trigger(['client.name', 'client.email', 'client.company', 'client.phone']);
    } else if (currentStep === 2) {
      valid = true;
    } else if (currentStep === 3) {
      valid = await trigger(['partDescription']);
    } else if (currentStep === 4) {
      if ((formValues.photos || []).length === 0) {
        setValue('photos', [] as File[], { shouldValidate: true });
        setPhotoPreviews([]);
        valid = true;
      } else {
        valid = true;
      }
    } else if (currentStep === 5) {
      valid = await trigger(['quantity', 'urgency']);
    } else {
      valid = true;
    }
    if (valid) setCurrentStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handlePrev = () => setCurrentStep((s) => Math.max(1, s - 1));

  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 space-y-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Demande de devis</h1>
        <p className="text-sm text-muted-foreground">
          Remplissez le formulaire. Réponse sous 2h ouvrées.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((s, idx) => {
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span
                  className={`text-xs ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && <div className="mx-2 mb-5 h-px flex-1 bg-border" />}
            </React.Fragment>
          );
        })}
      </div>

      <Card className="border-border/60">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold">Vos coordonnées</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pour l&apos;envoi du devis et le suivi.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nom du contact *</Label>
                  <Input
                    id="clientName"
                    placeholder="Mohamed Ben Salem"
                    {...register('client.name')}
                  />
                  {errors.client?.name && (
                    <p className="text-xs text-rose-500">{errors.client.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="m.bensalem@delice.tn"
                    {...register('client.email')}
                  />
                  {errors.client?.email && (
                    <p className="text-xs text-rose-500">{errors.client.email.message}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientCompany">Entreprise / Usine</Label>
                  <Input
                    id="clientCompany"
                    placeholder="Délice Danone, SITEX..."
                    {...register('client.company')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Téléphone</Label>
                  <Input
                    id="clientPhone"
                    placeholder="+216 98 123 456"
                    {...register('client.phone')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold">Machine & contexte</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pour retrouver les plans constructeurs.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="machineRef">Marque et modèle</Label>
                  <Input
                    id="machineRef"
                    placeholder="Ex: Ensacheuse TetraPak A3/Flex, Tour Haas..."
                    {...register('machineRef')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partFunction">Fonction mécanique de la pièce</Label>
                  <Input
                    id="partFunction"
                    placeholder="Ex: Étoile de sélection, bague de glissement..."
                    {...register('partFunction')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold">Description & matière</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Décrivez la pièce et sa défaillance.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partDescription">Description de la pièce *</Label>
                  <Textarea
                    id="partDescription"
                    placeholder="Forme (pignon, bague...), dimensions, nature de la cassure..."
                    className="min-h-[120px]"
                    {...register('partDescription')}
                  />
                  {errors.partDescription && (
                    <p className="text-xs text-rose-500">{errors.partDescription.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suspectedMaterial">Matière suspectée</Label>
                  <select
                    id="suspectedMaterial"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register('suspectedMaterial')}
                  >
                    <option value="">Laisser l&apos;atelier déterminer</option>
                    {MaterialSchema.options.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold">Photos</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Jusqu&apos;à 10 photos (JPG, PNG, WEBP).
                </p>
              </div>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="mx-auto mb-2 h-8 w-8 text-primary" />
                <p className="text-sm font-medium">
                  {isDragActive ? 'Déposez les photos...' : 'Cliquez ou glissez vos photos'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Max 10 Mo par fichier</p>
              </div>
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {photoPreviews.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Aperçu ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-rose-600"
                        aria-label="Supprimer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5 */}
          {currentStep === 5 && (
            <div className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold">Quantité & urgence</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Volume et délai de livraison souhaité.
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantité *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    className="max-w-xs font-mono font-bold"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau d&apos;urgence</Label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {URGENCY_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                          formValues.urgency === opt.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/40'
                        }`}
                      >
                        <input
                          type="radio"
                          value={opt.value}
                          className="shrink-0"
                          {...register('urgency')}
                        />
                        <div>
                          <div className={`text-sm font-medium ${opt.color}`}>{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 */}
          {currentStep === 6 && (
            <div className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold">Récapitulatif</h2>
                <p className="mt-1 text-xs text-muted-foreground">Vérifiez avant envoi.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Contact
                  </div>
                  <div className="font-medium">{formValues.client?.name || '—'}</div>
                  <div className="text-xs text-muted-foreground">
                    {formValues.client?.email} • {formValues.client?.phone}
                  </div>
                  <div className="text-xs">{formValues.client?.company || 'Non spécifiée'}</div>
                </div>
                <div className="space-y-1 rounded-lg border bg-muted/30 p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Commande
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Quantité</span>
                    <span className="font-mono font-bold">{formValues.quantity} pièce(s)</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Urgence</span>
                    <Badge
                      variant={formValues.urgency === 'critical' ? 'critical' : 'outline'}
                      className="text-[10px]"
                    >
                      {formValues.urgency ? FR.urgencies[formValues.urgency] : 'Normale'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Matière</span>
                    <span className="font-mono text-xs">
                      {formValues.suspectedMaterial || 'À déterminer'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-1 rounded-lg border bg-muted/30 p-4 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Description
                </div>
                <div className="text-xs text-muted-foreground">
                  Machine : {formValues.machineRef || 'Non spécifiée'}
                </div>
                <p className="mt-1 text-xs">{formValues.partDescription}</p>
              </div>
              {photoPreviews.length > 0 && (
                <div>
                  <div className="mb-2 text-xs text-muted-foreground">
                    Photos ({photoPreviews.length})
                  </div>
                  <div className="flex gap-2 overflow-x-auto">
                    {photoPreviews.map((url, i) => (
                      <div key={i} className="h-14 w-14 shrink-0 overflow-hidden rounded-md border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Thumb ${i}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <Button
              type="button"
              variant="ghost"
              disabled={currentStep === 1 || isPending}
              onClick={handlePrev}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Précédent
            </Button>
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext} className="gap-2">
                Suivant <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                {isPending ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
