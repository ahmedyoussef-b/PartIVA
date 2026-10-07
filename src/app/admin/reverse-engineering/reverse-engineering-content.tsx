'use client';

import * as React from 'react';
import Link from 'next/link';
import type { REProjectWithRelations } from '@/lib/data/reverse-engineering';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wrench,
  ArrowLeft,
  Scan,
  Ruler,
  Camera,
  FileCheck2,
  Hammer,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  Layers,
  Cpu,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

const EMPTY_MESURE = { cote: '', valeur: '', tolerance: '', note: '' };

interface ReverseEngineeringContentProps {
  project: REProjectWithRelations;
}

export default function ReverseEngineeringContent({ project }: ReverseEngineeringContentProps) {
  const request = project.requests[0] ?? null;

  const [steps, setSteps] = React.useState(project.steps);
  const [mesures, setMesures] = React.useState([
    {
      cote: 'Diamètre extérieur',
      valeur: '110',
      tolerance: 'h6',
      note: 'Mesuré au palmer numérique × 3',
    },
    { cote: 'Hauteur', valeur: '18', tolerance: '±0.05', note: 'Vérification plan comparateur' },
  ]);
  const [newMesure, setNewMesure] = React.useState(EMPTY_MESURE);
  const [materiauNotes, setMateriauNotes] = React.useState(
    'Test HVN Vickers : 54 — Densité volumique mesurée : 2.14 g/cm³ → Confirme PTFE standard.\nAucune charge ni additif visible au microscope optique (grossissement ×40).',
  );
  const [saved, setSaved] = React.useState(false);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  const toggleStep = (id: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const addMesure = () => {
    if (newMesure.cote && newMesure.valeur) {
      setMesures((prev) => [...prev, newMesure]);
      setNewMesure(EMPTY_MESURE);
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <Link
          href="/admin/demandes"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          File des demandes
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Reverse Engineering CAO
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Relevé de cotes, identification matière et reconstruction 3D à partir de la pièce
              d&apos;origine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={project.status === 'COMPLETED' ? 'default' : 'outline'}
              className="text-xs"
            >
              {project.status}
            </Badge>
            <span className="font-mono text-xs font-bold text-primary">
              {project.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Projet
              </span>
              <span className="font-semibold">{project.name}</span>
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <span className="font-semibold">{project.description || '—'}</span>
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Demandes liées
              </span>
              <span className="font-bold text-primary">{project.requests.length} demande(s)</span>
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fichiers CAO
              </span>
              <span className="font-bold text-primary">{project.cadFiles.length} fichier(s)</span>
            </div>
          </div>
          {request && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {request.partDescription}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Wrench className="h-4 w-4 text-primary" />
                Avancement RE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                  <span>Complété</span>
                  <span className="font-bold text-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>

              <div className="space-y-2 pt-1">
                {steps.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => toggleStep(step.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left text-xs transition-all ${
                      step.completed
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        step.completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <span className="text-[9px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className="font-medium">{step.name}</span>
                  </button>
                ))}
              </div>

              {progressPct === 100 && (
                <Link href="/admin/usinage">
                  <Button
                    size="sm"
                    className="mt-2 w-full gap-2 bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
                  >
                    <Hammer className="h-3.5 w-3.5" />
                    Valider → Lancer Usinage
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Camera className="h-3.5 w-3.5" />
                Photos reçues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const photos = Array.isArray(request?.photos)
                    ? request.photos.filter((p): p is string => typeof p === 'string')
                    : [];
                  return photos.map((url, i) => (
                    <div key={i} className="aspect-square overflow-hidden rounded-lg border bg-muted">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="mesures">
            <TabsList className="w-full">
              <TabsTrigger value="mesures" className="flex-1 text-xs">
                <Ruler className="mr-1.5 h-3.5 w-3.5" />
                Relevé de Cotes
              </TabsTrigger>
              <TabsTrigger value="materiau" className="flex-1 text-xs">
                <Scan className="mr-1.5 h-3.5 w-3.5" />
                Identification Matière
              </TabsTrigger>
              <TabsTrigger value="tolerances" className="flex-1 text-xs">
                <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                Tolérances & Fits
              </TabsTrigger>
              <TabsTrigger value="cad" className="flex-1 text-xs">
                <Cpu className="mr-1.5 h-3.5 w-3.5" />
                Dossier CAO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mesures" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    Tableau des cotes mesurées
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Saisir chaque cote relevée avec palmer numérique ou pied à coulisse calibré
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-hidden overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[400px] text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Côte</th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Valeur (mm)</th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Tolérance</th>
                          <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Note</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {mesures.map((m, i) => (
                          <tr key={i} className="border-t hover:bg-muted/20">
                            <td className="px-3 py-2.5 font-medium">{m.cote}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-primary">{m.valeur}</td>
                            <td className="px-3 py-2.5 font-mono">
                              <Badge variant="outline" className="text-[10px]">
                                {m.tolerance || '—'}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">{m.note}</td>
                            <td className="px-2 py-2.5">
                              <button
                                onClick={() =>
                                  setMesures((prev) => prev.filter((_, idx) => idx !== i))
                                }
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter une cote
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Désignation de la côte</Label>
                        <Input
                          placeholder="ex: Diamètre intérieur"
                          className="h-8 text-xs"
                          value={newMesure.cote}
                          onChange={(e) => setNewMesure((p) => ({ ...p, cote: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Valeur (mm)</Label>
                        <Input
                          placeholder="ex: 48.5"
                          className="h-8 font-mono text-xs"
                          value={newMesure.valeur}
                          onChange={(e) => setNewMesure((p) => ({ ...p, valeur: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tolérance ISO</Label>
                        <Input
                          placeholder="ex: H7 ou ±0.05"
                          className="h-8 font-mono text-xs"
                          value={newMesure.tolerance}
                          onChange={(e) =>
                            setNewMesure((p) => ({ ...p, tolerance: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Note métrologie</Label>
                        <Input
                          placeholder="Outil utilisé, nb mesures…"
                          className="h-8 text-xs"
                          value={newMesure.note}
                          onChange={(e) => setNewMesure((p) => ({ ...p, note: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={addMesure} className="gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      Ajouter la cote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="materiau" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Identification de la Matière
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Tests de caractérisation physico-chimique pour confirmer le polymère
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {[
                      { label: 'Matière suspectée (client)', value: request?.suspectedMaterial || '—', color: 'text-primary' },
                      { label: 'Couleur de la pièce', value: 'Blanc translucide', color: '' },
                      { label: 'Densité mesurée', value: '2.14 g/cm³', color: '' },
                      { label: 'Test HVN Vickers', value: '54 (Shore D ≈ 55)', color: '' },
                      { label: 'Absorption eau 24h', value: '< 0.01%', color: '' },
                      { label: 'Résistance solvants', value: 'Excellent (inerte NaOH, HCl)', color: '' },
                    ].map((prop) => (
                      <div key={prop.label} className="rounded-lg border bg-muted/20 p-3">
                        <span className="mb-1 block text-[10px] font-semibold uppercase text-muted-foreground">
                          {prop.label}
                        </span>
                        <span className={`text-xs font-bold ${prop.color || 'text-foreground'}`}>{prop.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700">Matière confirmée : PTFE standard</p>
                      <p className="text-[10px] text-muted-foreground">
                        Concordance densité + dureté + inertie chimique → PTFE non chargé
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes de caractérisation</Label>
                    <Textarea
                      className="min-h-24 resize-none font-mono text-xs"
                      value={materiauNotes}
                      onChange={(e) => setMateriauNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tolerances" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Tolérances & Fits ISO 286</CardTitle>
                  <CardDescription className="text-xs">
                    Spécification des ajustements fonctionnels selon la norme ISO 286-1
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
                    {[
                      { surface: 'Portée de joint (diamètre extérieur)', fit: 'h6', description: "Glissement précis dans l'alésage de la pompe", ra: 'Ra 1.6 µm' },
                      { surface: "Planéité de la face d'appui", fit: 'IT5', description: 'Étanchéité sans jeu — contact métal/plastique', ra: 'Ra 0.8 µm' },
                      { surface: 'Perçage de centrage Ø axe', fit: 'H7', description: 'Montage avec faible jeu sur axe inox', ra: 'Ra 3.2 µm' },
                    ].map((t) => (
                      <div key={t.surface} className="space-y-2 rounded-xl border bg-muted/20 p-4">
                        <div className="font-semibold text-foreground">{t.surface}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[11px]">{t.fit}</Badge>
                          <span className="text-[10px] text-muted-foreground">{t.ra}</span>
                        </div>
                        <p className="text-[10px] leading-snug text-muted-foreground">{t.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-muted-foreground">
                      Le PTFE a un fort coefficient de dilatation thermique (α ≈ 120×10⁻⁶/°C).
                      Prévoir un serrage léger en température de travail (85°C) pour éviter
                      l&apos;extrudage de la matière.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cad" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Dossier Technique CAO</CardTitle>
                  <CardDescription className="text-xs">
                    Fichiers de conception et traçabilité du reverse engineering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {project.cadFiles.length > 0 ? (
                      project.cadFiles.map((file) => {
                        const Icon = file.fileType.startsWith('CAD') ? Cpu : file.fileType === 'PDF' ? FileCheck2 : Layers;
                        const color = 'text-primary';
                        const border = 'border-border';
                        const bg = 'bg-muted/20';
                        return (
                          <div key={file.id} className={`flex items-center gap-3 rounded-xl border p-4 ${border} ${bg}`}>
                            <Icon className={`h-5 w-5 ${color} shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{file.name}</p>
                              <p className={`text-[10px] ${color}`}>{file.fileType}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>
                        );
                      })
                    ) : (
                      [
                        { name: 'Croquis coté annoté (PDF)', status: 'À produire', icon: FileCheck2, color: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                        { name: 'Modèle STEP 3D paramétrique', status: 'À produire', icon: Cpu, color: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                        { name: 'Programme CNC (G-code)', status: 'À générer', icon: Hammer, color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted/20' },
                        { name: 'Plan de contrôle qualité', status: 'À définir', icon: BarChart3, color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted/20' },
                      ].map((f) => {
                        const Icon = f.icon;
                        return (
                          <div key={f.name} className={`flex items-center gap-3 rounded-xl border p-4 ${f.border} ${f.bg}`}>
                            <Icon className={`h-5 w-5 ${f.color} shrink-0`} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{f.name}</p>
                              <p className={`text-[10px] ${f.color}`}>{f.status}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>
                        );
                      })
                    )}
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3 text-xs">
                    <Layers className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">
                        Référence projet : {project.id.slice(0, 8)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Projet RE en base de données
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} className="gap-2 font-bold" disabled={saved}>
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Dossier sauvegardé !
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder le dossier RE
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
