'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight } from 'lucide-react';
import type { MaterialWithDetails } from '@/lib/data/materials';

interface MateriauxPageClientProps {
  initialMaterials: MaterialWithDetails[];
}

export default function MateriauxPageClient({ initialMaterials }: MateriauxPageClientProps) {
  const [search, setSearch] = React.useState('');
  const [filterTemp, setFilterTemp] = React.useState<number | null>(null);

  const materials = React.useMemo(() => initialMaterials, [initialMaterials]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return materials.filter((mat) => {
      const matchQuery =
        mat.code.toLowerCase().includes(q) ||
        mat.name.toLowerCase().includes(q) ||
        (mat.description ?? '').toLowerCase().includes(q);
      const matchTemp = filterTemp ? (mat.maxTemp ?? 0) >= filterTemp : true;
      return matchQuery && matchTemp;
    });
  }, [materials, search, filterTemp]);

  return (
    <div className="container space-y-10 py-12">
      <div className="max-w-3xl space-y-3">
        <Badge variant="outline">Matières & Propriétés</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Guide des Plastiques Techniques Usinables
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Sélectionnez le polymère adapté aux contraintes réelles de fonctionnement de vos machines
          : température, frottement, chocs et agents corrosifs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card/60 flex flex-col items-center justify-between gap-4 rounded-xl border p-4 backdrop-blur sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
          <Input
            placeholder="Rechercher POM-C, PTFE, PEEK, Delrin..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground mr-1">Filtre Température :</span>
          <Button
            size="sm"
            variant={filterTemp === null ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setFilterTemp(null)}
          >
            Tous
          </Button>
          <Button
            size="sm"
            variant={filterTemp === 100 ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setFilterTemp(100)}
          >
            ≥ 100°C
          </Button>
          <Button
            size="sm"
            variant={filterTemp === 200 ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setFilterTemp(200)}
          >
            ≥ 200°C (Haute T°)
          </Button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mat) => (
          <Card
            key={mat.id}
            className="hover:border-primary/50 flex flex-col justify-between transition-all"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-primary font-mono text-xl font-bold">{mat.code}</span>
                <Badge variant={mat.foodGrade ? 'success' : 'secondary'} className="text-[10px]">
                  {mat.foodGrade ? 'FDA Alimentaire' : 'Technique Industriel'}
                </Badge>
              </div>
              <CardTitle className="mt-1 text-base leading-tight">{mat.name}</CardTitle>
              <span className="text-muted-foreground font-mono text-xs">{mat.category}</span>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-4 text-sm">
              <p className="text-muted-foreground line-clamp-3 text-xs leading-relaxed">
                {mat.description}
              </p>

              <div className="bg-muted/40 grid grid-cols-2 gap-2 rounded-lg border p-3 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">DENSITÉ</span>
                  <span className="text-foreground font-semibold">{mat.density} g/cm³</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">T° MAX CONTINUE</span>
                  <span className="text-foreground font-semibold">{mat.maxTemp} °C</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">FROTTEMENT (µ)</span>
                  <span className="text-foreground font-semibold">{mat.frictionCoefficient}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">TRACTION</span>
                  <span className="text-foreground font-semibold">{mat.tensileStrength} MPa</span>
                </div>
              </div>

              <div className="pt-2">
                <Link href={`/materiaux/${mat.slug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs font-semibold"
                  >
                    Consulter la fiche technique
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
