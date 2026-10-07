'use client';

import * as React from 'react';
import Link from 'next/link';
import { mapRequestToUi, type RequestWithRelations } from '@/lib/utils/request-mappers';
import { FR } from '@/i18n/fr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CandidateCard } from '@/components/domain/candidate-card';
import { SimilarityScore } from '@/components/domain/similarity-score';
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
  Loader2,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { SearchCandidate } from '@/schemas/search';
import { MOCK_SEARCH_CANDIDATES } from '@/lib/mock-data';
import { updateRequestStatus, updateRequestUrgency } from '@/lib/actions/requests';
import { useTransition } from 'react';
import type { RequestStatus, RequestUrgency } from '@/schemas/request';

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
];

type SearchState = 'idle' | 'running' | 'done';
type SourceProgress = Record<string, { state: SearchState; found: number }>;

const URGENCIES: { value: RequestUrgency; label: string }[] = [
  { value: 'low', label: 'Standard (7-10 jours ouvrés)' },
  { value: 'normal', label: 'Normale (4-6 jours ouvrés)' },
  { value: 'high', label: 'Haute (48-72h)' },
  { value: 'critical', label: 'Critique / Arrêt de ligne usine (24h)' },
];

const REQUEST_STATUSES: { value: RequestStatus; label: string }[] = [
  { value: 'new', label: 'Nouvelle demande' },
  { value: 'searching', label: 'Recherche multi-sources' },
  { value: 'candidate_found', label: 'Candidat identifié (≥ 70%)' },
  { value: 'reverse_engineering', label: 'Rétro-ingénierie CAO' },
  { value: 'validated', label: 'Validée pour usinage' },
  { value: 'machining', label: 'Usinage CNC en cours' },
  { value: 'completed', label: 'Terminée & Contrôlée' },
  { value: 'archived', label: 'Archivée' },
  { value: 'rejected', label: 'Refusée' },
];

interface RechercheClientProps {
  initialRequest: RequestWithRelations;
}

export default function RechercheClient({ initialRequest }: RechercheClientProps) {
  const request = mapRequestToUi(initialRequest);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: RequestStatus) => {
    startTransition(async () => {
      const result = await updateRequestStatus({ id: request.id, status });
      if (!result.success) {
        alert(result.error || 'Erreur lors de la mise à jour du statut');
      }
    });
  };

  const handleUrgencyChange = (urgency: RequestUrgency) => {
    startTransition(async () => {
      const result = await updateRequestUrgency({ id: request.id, urgency });
      if (!result.success) {
        alert(result.error || "Erreur lors de la mise à jour de l'urgence");
      }
    });
  };

  const [searchState, setSearchState] = React.useState<SearchState>('idle');
  const [sourceProgress, setSourceProgress] = React.useState<SourceProgress>({});
  const [candidates, setCandidates] = React.useState<SearchCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = React.useState<SearchCandidate | null>(null);
  const [activeSource, setActiveSource] = React.useState<string>('all');

  const totalProgress = React.useMemo(() => {
    if (searchState === 'idle') return 0;
    if (searchState === 'done') return 100;
    const done = Object.values(sourceProgress).filter((s) => s.state === 'done').length;
    return Math.round((done / SOURCES.length) * 100);
  }, [searchState, sourceProgress]);

  const handleSearch = async () => {
    setSearchState('running');
    setCandidates([]);
    setSelectedCandidate(null);
    const initial: SourceProgress = {};
    SOURCES.forEach((s) => {
      initial[s.id] = { state: 'idle', found: 0 };
    });
    setSourceProgress(initial);

    for (const src of SOURCES) {
      setSourceProgress((prev) => ({
        ...prev,
        [src.id]: { state: 'running', found: 0 },
      }));
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      const found = MOCK_SEARCH_CANDIDATES.filter((c) => c.source === src.id);
      setSourceProgress((prev) => ({
        ...prev,
        [src.id]: { state: 'done', found: found.length },
      }));
      setCandidates((prev) => [...prev, ...found]);
    }
    setSearchState('done');
  };

  const filtered =
    activeSource === 'all' ? candidates : candidates.filter((c) => c.source === activeSource);

  const bestCandidate = candidates.length
    ? candidates.reduce((a, b) => (a.scores.global > b.scores.global ? a : b))
    : null;

  const sourceLabel = (src: string) => SOURCES.find((s) => s.id === src)?.label ?? src;

  return (
    <div className="max-w-7xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/admin/demandes/${request.id}`}
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour au dossier {request.id.slice(0, 8)}
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Recherche Multi-Sources
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Interrogation simultanée : BDD locale → TraceParts → CADENAS → Index géométrique IA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-1 p-2 text-xs">
                  <Badge
                    variant={request.urgency === 'critical' ? 'critical' : 'outline'}
                    className="text-xs"
                  >
                    {FR.urgencies[request.urgency]}
                  </Badge>
                  {isPending && <span className="text-[10px] text-muted-foreground">...</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {URGENCIES.map((u) => (
                  <DropdownMenuItem
                    key={u.value}
                    onClick={() => handleUrgencyChange(u.value)}
                    className="text-xs"
                  >
                    {u.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 gap-1 p-2 text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {FR.statuses[request.status]}
                  </Badge>
                  {isPending && <span className="text-[10px] text-muted-foreground">...</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {REQUEST_STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    className="text-xs"
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Request context card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Client
              </span>
              <span className="font-semibold">{request.client.name}</span>
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Machine
              </span>
              <span className="font-mono">{request.machineRef || '—'}</span>
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Matière suspectée
              </span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {request.suspectedMaterial || 'Inconnue'}
              </Badge>
            </div>
            <div>
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Quantité
              </span>
              <span className="font-bold text-primary">{request.quantity} pièce(s)</span>
            </div>
          </div>
          <Separator className="my-3" />
          <p className="text-xs leading-relaxed text-muted-foreground">{request.partDescription}</p>
        </CardContent>
      </Card>

      {/* Search control panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sources panel */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Search className="h-4 w-4 text-primary" />
                Sources de Recherche
              </CardTitle>
              <CardDescription className="text-xs">
                Sélection automatique par pertinence matière / géométrie
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {SOURCES.map((src) => {
                const prog = sourceProgress[src.id];
                const Icon = src.icon;
                return (
                  <div
                    key={src.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
                      prog?.state === 'running'
                        ? `${src.borderColor} ${src.bgColor}`
                        : prog?.state === 'done'
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-border bg-muted/30'
                    }`}
                  >
                    <div className={`rounded-md p-1.5 ${src.bgColor}`}>
                      <Icon className={`h-3.5 w-3.5 ${src.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{src.label}</div>
                      <div className="text-[10px] text-muted-foreground">{src.description}</div>
                    </div>
                    <div className="shrink-0">
                      {prog?.state === 'running' && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      )}
                      {prog?.state === 'done' && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="font-mono text-[10px] font-bold text-emerald-600">
                            {prog.found}
                          </span>
                        </div>
                      )}
                      {(!prog || prog.state === 'idle') && (
                        <div className="h-4 w-4 rounded-full border-2 border-border" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Progress bar */}
              {searchState !== 'idle' && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                    <span>Progression globale</span>
                    <span>{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-1.5" />
                </div>
              )}

              <Button
                className="mt-2 w-full gap-2 font-bold"
                onClick={handleSearch}
                disabled={searchState === 'running'}
              >
                {searchState === 'running' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recherche en cours…
                  </>
                ) : searchState === 'done' ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Relancer la Recherche
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
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
                <CardTitle className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Meilleur Candidat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="font-bold text-foreground">{bestCandidate.name}</p>
                <p className="font-mono text-muted-foreground">{bestCandidate.reference}</p>
                <SimilarityScore score={bestCandidate.scores.global} label="Score global" />
                <div className="space-y-2 pt-2">
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
                    onClick={() => setSelectedCandidate(bestCandidate)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valider ce candidat
                  </Button>
                  <Link href={`/admin/reverse-engineering/${request.id}`}>
                    <Button size="sm" variant="outline" className="w-full gap-2 text-xs">
                      <Hammer className="h-3.5 w-3.5" />
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
              <CardContent className="space-y-3 p-4 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-muted-foreground">
                    Aucun candidat trouvé. La pièce nécessite un Reverse Engineering complet.
                  </p>
                </div>
                <Link href={`/admin/reverse-engineering/${request.id}`}>
                  <Button size="sm" variant="outline" className="w-full gap-2 border-amber-500/40">
                    <Hammer className="h-3.5 w-3.5" />
                    Démarrer le Reverse CAO
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results panel */}
        <div className="space-y-4 lg:col-span-2">
          {searchState === 'idle' && (
            <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Search className="h-8 w-8 text-primary/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aucune recherche lancée</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cliquez sur «&nbsp;Lancer la Recherche&nbsp;» pour interroger les 4 sources
                </p>
              </div>
            </div>
          )}

          {(searchState === 'running' || searchState === 'done') && (
            <>
              {/* Source filter tabs */}
              <Tabs value={activeSource} onValueChange={setActiveSource}>
                <TabsList className="h-auto w-full flex-wrap gap-1 p-1">
                  <TabsTrigger value="all" className="text-xs">
                    Tous ({candidates.length})
                  </TabsTrigger>
                  {SOURCES.map((src) => {
                    const count = candidates.filter((c) => c.source === src.id).length;
                    return (
                      <TabsTrigger key={src.id} value={src.id} className="text-xs">
                        {src.label.split(' ')[0]} ({count})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                <TabsContent value={activeSource} className="mt-4">
                  {filtered.length === 0 && searchState === 'running' ? (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Interrogation en cours…</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                      <Info className="h-6 w-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Aucun résultat pour cette source
                      </p>
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
                              setSelectedCandidate(selectedCandidate?.id === c.id ? null : c)
                            }
                          />
                        ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {/* Validate CTA */}
              {selectedCandidate && (
                <Card className="sticky bottom-4 border-emerald-500/40 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="text-xs">
                        <p className="font-bold text-emerald-700">
                          Candidat sélectionné : {selectedCandidate.reference}
                        </p>
                        <p className="mt-0.5 text-muted-foreground">
                          Score global : {Math.round(selectedCandidate.scores.global * 100)}% —{' '}
                          {sourceLabel(selectedCandidate.source)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/usinage`}>
                          <Button
                            size="sm"
                            className="gap-2 bg-emerald-600 text-xs font-bold hover:bg-emerald-700"
                          >
                            <Hammer className="h-3.5 w-3.5" />
                            Valider → Lancer Usinage
                          </Button>
                        </Link>
                        <Link href={`/admin/demandes/${request.id}`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <FileCheck2 className="mr-1.5 h-3.5 w-3.5" />
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
  );
}