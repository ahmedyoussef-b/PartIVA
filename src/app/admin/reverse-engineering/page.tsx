'use client'

import * as React from 'react'
import Link from 'next/link'
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
} from 'lucide-react'

const RE_STEPS = [
  { id: 'photos',     label: 'Photos & Numérisation',  done: true  },
  { id: 'mesures',    label: 'Relevé de cotes',         done: false },
  { id: 'materiau',   label: 'ID matière',              done: false },
  { id: 'tolérances', label: 'Tolérances & fits',       done: false },
  { id: 'validation', label: 'Validation CAO',          done: false },
]

const EMPTY_MESURE = { cote: '', valeur: '', tolerance: '', note: '' }

export default function ReverseEngineeringPage({
  params,
}: {
  params?: { id?: string }
}) {
  const requestId = params?.id
  const request = (requestId
    ? INITIAL_REQUESTS.find((r) => r.id === requestId) || INITIAL_REQUESTS[2]
    : INITIAL_REQUESTS[2]) ?? INITIAL_REQUESTS[0]

  const [steps, setSteps] = React.useState(RE_STEPS)

  if (!request) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Dossier introuvable
      </div>
    )
  }
  const [mesures, setMesures] = React.useState([
    { cote: 'Diamètre extérieur', valeur: '110', tolerance: 'h6', note: 'Mesuré au palmer numérique × 3' },
    { cote: 'Hauteur', valeur: '18', tolerance: '±0.05', note: 'Vérification plan comparateur' },
  ])
  const [newMesure, setNewMesure] = React.useState(EMPTY_MESURE)
  const [materiauNotes, setMateriauNotes] = React.useState(
    'Test HVN Vickers : 54 — Densité volumique mesurée : 2.14 g/cm³ → Confirme PTFE standard.\nAucune charge ni additif visible au microscope optique (grossissement ×40).'
  )
  const [saved, setSaved] = React.useState(false)

  const completedCount = steps.filter((s) => s.done).length
  const progressPct = Math.round((completedCount / steps.length) * 100)

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    )
  }

  const addMesure = () => {
    if (newMesure.cote && newMesure.valeur) {
      setMesures((prev) => [...prev, newMesure])
      setNewMesure(EMPTY_MESURE)
    }
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <div>
        {requestId ? (
          <Link
            href={`/admin/demandes/${request.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au dossier {request.cloudId ? `#REQ-${request.cloudId}` : request.id.slice(0, 8)}
          </Link>
        ) : (
          <Link
            href="/admin/demandes"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            File des demandes
          </Link>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reverse Engineering CAO
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Relevé de cotes, identification matière et reconstruction 3D à partir de la pièce d'origine.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={request.urgency === 'critical' ? 'critical' : 'outline'} className="text-xs">
              {FR.urgencies[request.urgency]}
            </Badge>
            <span className="font-mono text-xs font-bold text-primary">
              {request.cloudId ? `#REQ-${request.cloudId}` : request.id.slice(0, 8)}
            </span>
          </div>
        </div>
      </div>

      {/* Client context */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-0.5">Client</span>
              <span className="font-semibold">{request.client.company || request.client.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-0.5">Machine</span>
              <span className="font-mono">{request.machineRef || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-0.5">Matière suspectée</span>
              <Badge variant="outline" className="text-[10px] font-mono">{request.suspectedMaterial}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-0.5">Quantité</span>
              <span className="font-bold text-primary">×{request.quantity} pièce(s)</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{request.partDescription}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* RE Progress steps */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Avancement RE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
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
                    className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-xs transition-all text-left ${
                      step.done
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'
                        : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 shrink-0 ${
                      step.done
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-border'
                    }`}>
                      {step.done ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <span className="text-[9px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span className="font-medium">{step.label}</span>
                  </button>
                ))}
              </div>

              {progressPct === 100 && (
                <Link href="/admin/usinage">
                  <Button size="sm" className="w-full gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 mt-2">
                    <Hammer className="w-3.5 h-3.5" />
                    Valider → Lancer Usinage
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Photo viewer */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Photos reçues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {request.photos.map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg border bg-muted overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main workspace */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="mesures">
            <TabsList className="w-full">
              <TabsTrigger value="mesures" className="flex-1 text-xs">
                <Ruler className="w-3.5 h-3.5 mr-1.5" />
                Relevé de Cotes
              </TabsTrigger>
              <TabsTrigger value="materiau" className="flex-1 text-xs">
                <Scan className="w-3.5 h-3.5 mr-1.5" />
                Identification Matière
              </TabsTrigger>
              <TabsTrigger value="tolerances" className="flex-1 text-xs">
                <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                Tolérances & Fits
              </TabsTrigger>
              <TabsTrigger value="cad" className="flex-1 text-xs">
                <Cpu className="w-3.5 h-3.5 mr-1.5" />
                Dossier CAO
              </TabsTrigger>
            </TabsList>

            {/* Mesures tab */}
            <TabsContent value="mesures" className="mt-4 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Tableau des cotes mesurées</CardTitle>
                  <CardDescription className="text-xs">
                    Saisir chaque cote relevée avec palmer numérique ou pied à coulisse calibré
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing mesures */}
                  <div className="rounded-lg border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Côte</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Valeur (mm)</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Tolérance</th>
                          <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Note</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {mesures.map((m, i) => (
                          <tr key={i} className="border-t hover:bg-muted/20">
                            <td className="px-3 py-2.5 font-medium">{m.cote}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-primary">{m.valeur}</td>
                            <td className="px-3 py-2.5 font-mono">
                              <Badge variant="outline" className="text-[10px]">{m.tolerance || '—'}</Badge>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">{m.note}</td>
                            <td className="px-2 py-2.5">
                              <button
                                onClick={() => setMesures((prev) => prev.filter((_, idx) => idx !== i))}
                                className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add mesure */}
                  <div className="rounded-lg border p-4 bg-muted/20 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter une cote
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Désignation de la côte</Label>
                        <Input
                          placeholder="ex: Diamètre intérieur"
                          className="text-xs h-8"
                          value={newMesure.cote}
                          onChange={(e) => setNewMesure((p) => ({ ...p, cote: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Valeur (mm)</Label>
                        <Input
                          placeholder="ex: 48.5"
                          className="text-xs h-8 font-mono"
                          value={newMesure.valeur}
                          onChange={(e) => setNewMesure((p) => ({ ...p, valeur: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Tolérance ISO</Label>
                        <Input
                          placeholder="ex: H7 ou ±0.05"
                          className="text-xs h-8 font-mono"
                          value={newMesure.tolerance}
                          onChange={(e) => setNewMesure((p) => ({ ...p, tolerance: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Note métrologie</Label>
                        <Input
                          placeholder="Outil utilisé, nb mesures…"
                          className="text-xs h-8"
                          value={newMesure.note}
                          onChange={(e) => setNewMesure((p) => ({ ...p, note: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={addMesure} className="gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter la cote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materiau tab */}
            <TabsContent value="materiau" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Identification de la Matière</CardTitle>
                  <CardDescription className="text-xs">
                    Tests de caractérisation physico-chimique pour confirmer le polymère
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Matière suspectée (client)', value: request.suspectedMaterial, color: 'text-primary' },
                      { label: 'Couleur de la pièce', value: 'Blanc translucide', color: '' },
                      { label: 'Densité mesurée', value: '2.14 g/cm³', color: '' },
                      { label: 'Test HVN Vickers', value: '54 (Shore D ≈ 55)', color: '' },
                      { label: 'Absorption eau 24h', value: '< 0.01%', color: '' },
                      { label: 'Résistance solvants', value: 'Excellent (inerte NaOH, HCl)', color: '' },
                    ].map((prop) => (
                      <div key={prop.label} className="p-3 rounded-lg border bg-muted/20">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">{prop.label}</span>
                        <span className={`text-xs font-bold ${prop.color || 'text-foreground'}`}>{prop.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-700">Matière confirmée : PTFE standard</p>
                      <p className="text-[10px] text-muted-foreground">Concordance densité + dureté + inertie chimique → PTFE non chargé</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes de caractérisation</Label>
                    <Textarea
                      className="text-xs min-h-24 resize-none font-mono"
                      value={materiauNotes}
                      onChange={(e) => setMateriauNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tolerances tab */}
            <TabsContent value="tolerances" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Tolérances & Fits ISO 286</CardTitle>
                  <CardDescription className="text-xs">
                    Spécification des ajustements fonctionnels selon la norme ISO 286-1
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    {[
                      {
                        surface: "Portée de joint (diamètre extérieur)",
                        fit: "h6",
                        description: "Glissement précis dans l'alésage de la pompe",
                        ra: "Ra 1.6 µm",
                      },
                      {
                        surface: "Planéité de la face d'appui",
                        fit: "IT5",
                        description: "Étanchéité sans jeu — contact métal/plastique",
                        ra: "Ra 0.8 µm",
                      },
                      {
                        surface: "Perçage de centrage Ø axe",
                        fit: "H7",
                        description: "Montage avec faible jeu sur axe inox",
                        ra: "Ra 3.2 µm",
                      },
                    ].map((t) => (
                      <div key={t.surface} className="p-4 rounded-xl border space-y-2 bg-muted/20">
                        <div className="font-semibold text-foreground">{t.surface}</div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[11px]">{t.fit}</Badge>
                          <span className="text-muted-foreground text-[10px]">{t.ra}</span>
                        </div>
                        <p className="text-muted-foreground text-[10px] leading-snug">{t.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      Le PTFE a un fort coefficient de dilatation thermique (α ≈ 120×10⁻⁶/°C). Prévoir un serrage léger en température de travail (85°C) pour éviter l'extrudage de la matière.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* CAO tab */}
            <TabsContent value="cad" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Dossier Technique CAO</CardTitle>
                  <CardDescription className="text-xs">
                    Fichiers de conception et traçabilité du reverse engineering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { name: 'Croquis coté annoté (PDF)', status: 'À produire', icon: FileCheck2, color: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                      { name: 'Modèle STEP 3D paramétrique', status: 'À produire', icon: Cpu, color: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
                      { name: 'Programme CNC (G-code)', status: 'À générer', icon: Hammer, color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted/20' },
                      { name: 'Plan de contrôle qualité', status: 'À définir', icon: BarChart3, color: 'text-muted-foreground', border: 'border-border', bg: 'bg-muted/20' },
                    ].map((f) => {
                      const Icon = f.icon
                      return (
                        <div key={f.name} className={`flex items-center gap-3 p-4 rounded-xl border ${f.border} ${f.bg}`}>
                          <Icon className={`w-5 h-5 ${f.color} shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{f.name}</p>
                            <p className={`text-[10px] ${f.color}`}>{f.status}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      )
                    })}
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20 border text-xs">
                    <Layers className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium">Référence à créer : {request.cloudId ? `RE-${request.cloudId}` : 'RE-NEW'}</p>
                      <p className="text-muted-foreground text-[10px]">
                        Sera archivée dans la BDD locale une fois validée
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save button */}
          <div className="flex justify-end mt-4">
            <Button onClick={handleSave} className="gap-2 font-bold" disabled={saved}>
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Dossier sauvegardé !
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder le dossier RE
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
