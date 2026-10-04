'use client'

import * as React from 'react'
import Link from 'next/link'
import { INITIAL_REQUESTS, MOCK_SEARCH_CANDIDATES } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CandidateCard } from '@/components/domain/candidate-card'
import { SimilarityScore } from '@/components/domain/similarity-score'
import {
  ArrowLeft,
  Search,
  Database,
  Globe,
  Cpu,
  Scan,
  RefreshCw,
  CheckCircle2,
  Hammer,
  FileCheck2,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react'
import type { SearchCandidate } from '@/schemas/search'

const SOURCES = [
  {
    id: 'local_db',
    label: 'BDD Locale SQLite',
    icon: Database,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Archive interne — pièces déjà usinées',
  },
  {
    id: 'traceparts',
    label: 'TraceParts / PartCloud',
    icon: Globe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Bibliothèque CAO industrielle 200M+ refs',
  },
  {
    id: 'cadenas',
    label: 'CADENAS PARTsolutions',
    icon: Cpu,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    description: 'Catalogue normalisé fournisseurs industriels',
  },
  {
    id: 'geometric_search',
    label: 'Recherche Géométrique IA',
    icon: Scan,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Index de similarité 3D par embedding',
  },
]

type SearchState = 'idle' | 'running' | 'done'
type SourceProgress = Record<string, { state: SearchState; found: number }>

export default function RechercheMultiSourcePage({
  params,
}: {
  params: { id: string }
}) {
  const request =
    INITIAL_REQUESTS.find((r) => r.id === params.id) || INITIAL_REQUESTS[0]

  const [searchState, setSearchState] = React.useState<SearchState>('idle')
  const [sourceProgress, setSourceProgress] = React.useState<SourceProgress>({})
  const [candidates, setCandidates] = React.useState<SearchCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = React.useState<SearchCandidate | null>(null)
  const [activeSource, setActiveSource] = React.useState<string>('all')

  const totalProgress = React.useMemo(() => {
    if (searchState === 'idle') return 0
    if (searchState === 'done') return 100
    const done = Object.values(sourceProgress).filter((s) => s.state === 'done').length
    return Math.round((done / SOURCES.length) * 100)
  }, [searchState, sourceProgress])

  if (!request) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Demande introuvable
      </div>
    )
  }

  const handleSearch = async () => {
    setSearchState('running')
    setCandidates([])
    setSelectedCandidate(null)
    const initial: SourceProgress = {}
    SOURCES.forEach((s) => {
      initial[s.id] = { state: 'idle', found: 0 }
    })
    setSourceProgress(initial)

    // Simulate sequential source searching
    for (const src of SOURCES) {
      setSourceProgress((prev) => ({
        ...prev,
        [src.id]: { state: 'running', found: 0 },
      }))
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))
      const found = MOCK_SEARCH_CANDIDATES.filter((c) => c.source === src.id)
      setSourceProgress((prev) => ({
        ...prev,
        [src.id]: { state: 'done', found: found.length },
      }))
      setCandidates((prev) => [...prev, ...found])
    }
    setSearchState('done')
  }

  const filtered =
    activeSource === 'all'
      ? candidates
      : candidates.filter((c) => c.source === activeSource)

  const bestCandidate = candidates.length
    ? candidates.reduce((a, b) => (a.scores.global > b.scores.global ? a : b))
    : null

  const sourceLabel = (src: string) =>
    SOURCES.find((s) => s.id === src)?.label ?? src

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/admin/demandes/${request.id}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au dossier {request.cloudId ? `#REQ-${request.cloudId}` : request.id.slice(0, 8)}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Recherche Multi-Sources
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Interrogation simultanée : BDD locale → TraceParts → CADENAS → Index géométrique IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={request.urgency === 'critical' ? 'critical' : 'outline'} className="text-xs">
              {FR.urgencies[request.urgency]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {FR.statuses[request.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Request context card */}
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
              <Badge variant="outline" className="text-[10px] font-mono">{request.suspectedMaterial || 'Inconnue'}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px] font-semibold uppercase tracking-wider mb-0.5">Quantité</span>
              <span className="font-bold text-primary">{request.quantity} pièce(s)</span>
            </div>
          </div>
          <Separator className="my-3" />
          <p className="text-xs text-muted-foreground leading-relaxed">{request.partDescription}</p>
        </CardContent>
      </Card>

      {/* Search control panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sources panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                Sources de Recherche
              </CardTitle>
              <CardDescription className="text-xs">
                Sélection automatique par pertinence matière / géométrie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SOURCES.map((src) => {
                const prog = sourceProgress[src.id]
                const Icon = src.icon
                return (
                  <div
                    key={src.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      prog?.state === 'running'
                        ? `${src.borderColor} ${src.bgColor}`
                        : prog?.state === 'done'
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${src.bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${src.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold truncate">{src.label}</div>
                      <div className="text-[10px] text-muted-foreground">{src.description}</div>
                    </div>
                    <div className="shrink-0">
                      {prog?.state === 'running' && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      {prog?.state === 'done' && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-mono font-bold text-emerald-600">
                            {prog.found}
                          </span>
                        </div>
                      )}
                      {(!prog || prog.state === 'idle') && (
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Progress bar */}
              {searchState !== 'idle' && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Progression globale</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-1.5" />
                </div>
              )}

              <Button
                className="w-full gap-2 font-bold mt-2"
                onClick={handleSearch}
                disabled={searchState === 'running'}
              >
                {searchState === 'running' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recherche en cours…
                  </>
                ) : searchState === 'done' ? (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Relancer la Recherche
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lancer la Recherche
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Best candidate highlight */}
          {bestCandidate && searchState === 'done' && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meilleur Candidat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="font-bold text-foreground">{bestCandidate.name}</p>
                <p className="text-muted-foreground font-mono">{bestCandidate.reference}</p>
                <SimilarityScore score={bestCandidate.scores.global} label="Score global" />
                <div className="pt-2 space-y-2">
                  <Button
                    size="sm"
                    className="w-full gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => setSelectedCandidate(bestCandidate)}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valider ce candidat
                  </Button>
                  <Link href={`/admin/reverse-engineering/${request.id}`}>
                    <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                      <Hammer className="w-3.5 h-3.5" />
                      Bascule Reverse CAO
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No result → guide to RE */}
          {searchState === 'done' && candidates.length === 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">
                    Aucun candidat trouvé. La pièce nécessite un Reverse Engineering complet.
                  </p>
                </div>
                <Link href={`/admin/reverse-engineering/${request.id}`}>
                  <Button size="sm" variant="outline" className="w-full gap-2 border-amber-500/40">
                    <Hammer className="w-3.5 h-3.5" />
                    Démarrer le Reverse CAO
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          {searchState === 'idle' && (
            <div className="h-64 flex flex-col items-center justify-center text-center gap-4 rounded-xl border border-dashed bg-muted/20">
              <div className="p-4 rounded-full bg-primary/10">
                <Search className="w-8 h-8 text-primary/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aucune recherche lancée
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Cliquez sur «&nbsp;Lancer la Recherche&nbsp;» pour interroger les 4 sources
                </p>
              </div>
            </div>
          )}

          {(searchState === 'running' || searchState === 'done') && (
            <>
              {/* Source filter tabs */}
              <Tabs value={activeSource} onValueChange={setActiveSource}>
                <TabsList className="w-full h-auto flex-wrap gap-1 p-1">
                  <TabsTrigger value="all" className="text-xs">
                    Tous ({candidates.length})
                  </TabsTrigger>
                  {SOURCES.map((src) => {
                    const count = candidates.filter((c) => c.source === src.id).length
                    return (
                      <TabsTrigger key={src.id} value={src.id} className="text-xs">
                        {src.label.split(' ')[0]} ({count})
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                <TabsContent value={activeSource} className="mt-4">
                  {filtered.length === 0 && searchState === 'running' ? (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Interrogation en cours…</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-center">
                      <Info className="w-6 h-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Aucun résultat pour cette source</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filtered
                        .sort((a, b) => b.scores.global - a.scores.global)
                        .map((c) => (
                          <CandidateCard
                            key={c.id}
                            candidate={c}
                            sourceLabel={sourceLabel(c.source)}
                            isSelected={selectedCandidate?.id === c.id}
                            onSelect={() =>
                              setSelectedCandidate(
                                selectedCandidate?.id === c.id ? null : c
                              )
                            }
                          />
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Validate CTA */}
              {selectedCandidate && (
                <Card className="border-emerald-500/40 bg-emerald-500/5 sticky bottom-4">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="text-xs">
                        <p className="font-bold text-emerald-700">
                          Candidat sélectionné : {selectedCandidate.reference}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          Score global : {Math.round(selectedCandidate.scores.global * 100)}% —{' '}
                          {sourceLabel(selectedCandidate.source)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/usinage`}>
                          <Button size="sm" className="gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700">
                            <Hammer className="w-3.5 h-3.5" />
                            Valider → Lancer Usinage
                          </Button>
                        </Link>
                        <Link href={`/admin/demandes/${request.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                            Enregistrer & Revenir
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
