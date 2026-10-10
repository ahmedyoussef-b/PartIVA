'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin } from 'lucide-react';
import { getPartStatusLabel } from '@/lib/enum-labels';
import type { PartStatus } from '@/generated/prisma/browser';

interface SearchResultItem {
  id: string;
  ptvReference: string | null;
  partNumber: string;
  name: string;
  description: string | null;
  status: string;
  rank: number;
}

const DEBOUNCE_MS = 300;

export function SearchBar() {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const timer = setTimeout(async () => {
      setPending(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=20`);
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
  }, [query]);

  const showEmpty = !pending && searched && results.length === 0 && query.trim().length >= 2;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une pièce (nom, référence, matière…)…"
          className="pl-9"
          aria-label="Rechercher une pièce"
        />
      </div>

      {pending && <p className="text-muted-foreground text-sm">Recherche…</p>}

      {showEmpty && (
        <p className="text-muted-foreground text-sm">Aucun résultat pour « {query.trim()} ».</p>
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
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {getPartStatusLabel(result.status as PartStatus)}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="font-mono text-[10px]"
                      title="Score de pertinence"
                    >
                      {result.rank.toFixed(2)}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground flex items-center gap-1 text-[11px]">
        <MapPin className="h-3 w-3" />
        Recherche full-text PostgreSQL (nom, description, références PTV et pièce).
      </p>
    </div>
  );
}
