'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, ImagePlus } from 'lucide-react';
import { getPartStatusLabel } from '@/lib/enum-labels';
import type { PartStatus } from '@/generated/prisma/browser';

type SearchMode = 'text' | 'reference' | 'specs' | 'dimensions' | 'multi' | 'photo';

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
  score?: number;
  breakdown?: Record<string, number>;
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

const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const [query, setQuery] = React.useState('');
  const [mode, setMode] = React.useState<SearchMode>('text');
  const [min, setMin] = React.useState('');
  const [max, setMax] = React.useState('');
  const [specKey, setSpecKey] = React.useState('');
  const [matchMode, setMatchMode] = React.useState<'nominal' | 'tolerance'>('nominal');
  const [multiReference, setMultiReference] = React.useState('');
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoData, setPhotoData] = React.useState('');
  const [photoMime, setPhotoMime] = React.useState('');
  const [photoError, setPhotoError] = React.useState('');
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  const isDimensions = mode === 'dimensions';
  const isMulti = mode === 'multi';
  const isPhoto = mode === 'photo';
  const hasDimensionBounds = min !== '' || max !== '';

  React.useEffect(() => {
    if (isDimensions) {
      if (!hasDimensionBounds) {
        return;
      }
    } else if (isMulti) {
      const hasCriteria =
        query.trim().length >= 2 || multiReference.trim().length >= 2 || min !== '' || max !== '';
      if (!hasCriteria) {
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
    } else if (isMulti) {
      if (query.trim().length >= 2) {
        params.set('q', query.trim());
      }
      if (multiReference.trim().length >= 2) {
        params.set('reference', multiReference.trim());
      }
      if (min !== '') {
        params.set('min', min);
      }
      if (max !== '') {
        params.set('max', max);
      }
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
  }, [
    query,
    mode,
    min,
    max,
    specKey,
    matchMode,
    multiReference,
    isDimensions,
    isMulti,
    hasDimensionBounds,
  ]);

  async function handlePhotoSearch() {
    if (!photoFile || !photoData) {
      setPhotoError('Sélectionnez une image (JPEG, PNG ou WebP).');
      return;
    }

    setPhotoError('');
    setPending(true);
    try {
      const res = await fetch('/api/search/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mimeType: photoMime,
          data: photoData,
          limit: 20,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 503) {
          setPhotoError('Recherche par photo indisponible (HF_API_TOKEN absent).');
        } else {
          setPhotoError((data as { message?: string }).message ?? `Erreur ${res.status}`);
        }
        setResults([]);
        setSearched(true);
        return;
      }

      const data = await res.json();
      setResults(data.results ?? []);
      setSearched(true);
    } catch {
      setPhotoError('Erreur réseau — réessayez.');
      setResults([]);
      setSearched(true);
    } finally {
      setPending(false);
    }
  }

  function handlePhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPhotoError('');
    setPhotoFile(file ?? null);
    setPhotoData('');
    setPhotoMime('');
    setResults([]);
    setSearched(false);

    if (!file) {
      return;
    }

    if (!PHOTO_MIME_TYPES.includes(file.type)) {
      setPhotoError('Format non supporté — JPEG, PNG ou WebP uniquement.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image trop volumineuse (5 Mo max).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const commaIndex = dataUrl.indexOf(',');
      setPhotoData(commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl);
      setPhotoMime(file.type);
    };
    reader.onerror = () => {
      setPhotoError('Échec de la lecture du fichier.');
    };
    reader.readAsDataURL(file);
  }

  const showEmpty =
    !pending &&
    searched &&
    results.length === 0 &&
    !photoError &&
    (isDimensions
      ? hasDimensionBounds
      : isMulti
        ? query.trim().length >= 2 || multiReference.trim().length >= 2 || min !== '' || max !== ''
        : isPhoto
          ? Boolean(photoData)
          : query.trim().length >= 2);

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
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'multi'}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'multi'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
          onClick={() => setMode('multi')}
        >
          Multi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'photo'}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            mode === 'photo'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/70'
          }`}
          onClick={() => setMode('photo')}
        >
          Photo
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
      ) : isMulti ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Texte (nom, matière…)…"
            className="w-48"
            aria-label="Recherche texte"
          />
          <Input
            value={multiReference}
            onChange={(e) => setMultiReference(e.target.value)}
            placeholder="Référence (PTV-…)…"
            className="w-48"
            aria-label="Référence"
          />
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
        </div>
      ) : isPhoto ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoFileChange}
              className="w-64 text-xs"
              aria-label="Image de recherche"
            />
            <button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handlePhotoSearch}
              disabled={!photoData || pending}
            >
              Rechercher
            </button>
            <ImagePlus className="text-muted-foreground h-4 w-4" />
          </div>
          {photoFile && (
            <p className="text-muted-foreground text-[11px]">
              {photoFile.name} — {(photoFile.size / 1024).toFixed(0)} Ko — {photoMime}
            </p>
          )}
          {photoError && (
            <p className="text-destructive text-xs" role="alert">
              {photoError}
            </p>
          )}
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
                    {typeof result.score === 'number' && (
                      <details className="mt-0.5">
                        <summary className="text-muted-foreground cursor-pointer text-[11px]">
                          Détail du score
                        </summary>
                        <ul className="text-muted-foreground mt-0.5 space-y-0.5 text-[11px]">
                          {Object.entries(result.breakdown ?? {}).map(([key, value]) => (
                            <li key={key}>
                              {key} : {value.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                      </details>
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
                    {typeof result.score === 'number' && (
                      <Badge
                        variant="secondary"
                        className="font-mono text-[10px]"
                        title="Score multi-critères"
                      >
                        {result.score.toFixed(2)}
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
              : mode === 'multi'
                ? 'Recherche multi-critères — combine texte, référence et dimensions en un score pondéré.'
                : mode === 'photo'
                  ? "Recherche par similarité visuelle — upload d'une photo (JPEG, PNG, WebP, 5 Mo max)."
                  : 'Recherche full-text PostgreSQL (nom, description, références PTV et pièce).'}
      </p>
    </div>
  );
}
