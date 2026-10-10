'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin } from 'lucide-react';
import { getPartStatusLabel } from '@/lib/enum-labels';
import type { PartStatus } from '@/generated/prisma/browser';

type SearchMode = 'text' | 'reference' | 'specs' | 'dimensions';

interface SearchResultItem {
  id: string;
  ptvReference: string | null;
  partNumber: string | null;
  name: string | null;
  description?: string | null;
  status: string;
  rank?: number;
  matchType?: 'exact' | 'prefix';
  matchedSpecs?: { key: string; value: string }[];
  specKey?: string;
  specValue?: string;
  unit?: string | null;
  toleranceMin?: number | null;
  toleranceMax?: number | null;
}

const DIMENSION_KEYS = [
  'diameter_ext',
  'diameter_int',
  'width',
  'weight',
  'module',
  'teeth',
  'bore',
  'contact_angle',
];

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const [query, setQuery] = React.useState('');
  const [mode, setMode] = React.useState<SearchMode>('text');
  const [min, setMin] = React.useState('');
  const [max, setMax] = React.useState('');
  const [specKey, setSpecKey] = React.useState('');
  const [matchMode, setMatchMode] = React.useState<'nominal' | 'tolerance'>('nominal');
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  const isDimensions = mode === 'dimensions';
  const hasDimensionBounds = min !== '' || max !== '';

  React.useEffect(() => {
    if (isDimensions) {
      if (!hasDimensionBounds) {
        return;
      }
    } else {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        return;
      }
    }

    const params = new URLSearchParams();
    params.set('limit', '20');
    params.set('mode', mode);
    if (isDimensions) {
      if (min !== '') {
        params.set('min', min);
      }
      if (max !== '') {
        params.set('max', max);
      }
      if (specKey !== '') {
        params.set('key', specKey);
      }
      params.set('matchMode', matchMode);
    } else {
      params.set('q', query.trim());
    }

    const timer = setTimeout(async () => {
      setPending(true);
      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`);
        }
        const data = await res.json();
        setResults(data.results ?? []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setPending(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query, mode, min, max, specKey, matchMode, isDimensions, hasDimensionBounds]);

  const showEmpty =
    !pending &&
    searched &&
    results.length === 0 &&
    (isDimensions ? hasDimensionBounds : query.trim().length >= 2);

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist" aria-label="Mode de recherche">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
          onClick={() => setMode('text')}
        >
          Texte
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'reference'}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'reference'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
          onClick={() => setMode('reference')}
        >
          Référence
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'specs'}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'specs'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
          onClick={() => setMode('specs')}
        >
          Spécifications
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'dimensions'}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'dimensions'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
          onClick={() => setMode('dimensions')}
        >
          Dimensions
        </button>
      </div>

      {isDimensions ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder="Min"
            className="w-24"
            aria-label="Valeur minimale"
          />
          <span className="text-muted-foreground text-xs">à</span>
          <Input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder="Max"
            className="w-24"
            aria-label="Valeur maximale"
          />
          <select
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            className="border-input bg-background text-foreground rounded-md border px-2 py-1.5 text-xs"
            aria-label="Clé de spécification"
          >
            <option value="">Toutes les clés</option>
            {DIMENSION_KEYS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <select
            value={matchMode}
            onChange={(e) => setMatchMode(e.target.value as 'nominal' | 'tolerance')}
            className="border-input bg-background text-foreground rounded-md border px-2 py-1.5 text-xs"
            aria-label="Type de correspondance"
          >
            <option value="nominal">Nominal (valeur)</option>
            <option value="tolerance">Tolérance (plage)</option>
          </select>
        </div>
      ) : (
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'reference'
                ? 'Rechercher par référence (PTV-… ou n° fournisseur)…'
                : mode === 'specs'
                  ? 'Rechercher une matière, une dimension…'
                  : 'Rechercher une pièce (nom, référence, matière…)…'
            }
            className="pl-9"
            aria-label="Rechercher une pièce"
          />
        </div>
      )}

      {pending && <p className="text-muted-foreground text-sm">Recherche…</p>}

      {showEmpty && (
        <p className="text-muted-foreground text-sm">
          {isDimensions
            ? 'Aucun résultat pour cette plage dimensionnelle.'
            : `Aucun résultat pour « ${query.trim()} ».`}
        </p>
      )}

      {results.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {results.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="hover:bg-muted/30 flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => router.push(`/admin/pieces?part=${result.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-primary font-mono text-xs font-bold">
                        {result.ptvReference ?? result.partNumber}
                      </span>
                      <span className="truncate text-xs font-medium">{result.name}</span>
                    </div>
                    {result.description && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                        {result.description}
                      </p>
                    )}
                    {result.matchedSpecs && result.matchedSpecs.length > 0 && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                        {result.matchedSpecs
                          .map((spec) => `${spec.key} : ${spec.value}`)
                          .join(' · ')}
                      </p>
                    )}
                    {result.specKey && (
                      <p className="text-muted-foreground mt-0.5 line-clamp-1 text-[11px]">
                        {result.specKey} : {result.specValue}
                        {result.unit ? ` ${result.unit}` : ''}
                        {result.toleranceMin !== null &&
                          result.toleranceMin !== undefined &&
                          result.toleranceMax !== null &&
                          result.toleranceMax !== undefined && (
                            <span>
                              {' '}
                              (tolérance {result.toleranceMin} – {result.toleranceMax})
                            </span>
                          )}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {getPartStatusLabel(result.status as PartStatus)}
                    </Badge>
                    {result.matchType && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                        title="Type de correspondance"
                      >
                        {result.matchType === 'exact' ? 'exact' : 'préfixe'}
                      </Badge>
                    )}
                    {typeof result.rank === 'number' && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                        title="Score de pertinence"
                      >
                        {result.rank.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
        <MapPin className="h-3 w-3" />
        {mode === 'reference'
          ? 'Recherche par référence exacte ou préfixe (PTV, n° fournisseur).'
          : mode === 'specs'
            ? 'Recherche full-text PostgreSQL sur les valeurs de spécifications (matière, dimensions, …).'
            : mode === 'dimensions'
              ? 'Recherche numérique sur les spécifications — range sur la valeur nominale ou tolérance couvrante.'
              : 'Recherche full-text PostgreSQL (nom, description, références PTV et pièce).'}
      </p>
    </div>
  );
}
