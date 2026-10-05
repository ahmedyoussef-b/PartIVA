'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MATERIALS_CATALOG } from '@/lib/mock-data';
import { Search, ArrowRight } from 'lucide-react';

export default function MateriauxPage() {
  const [search, setSearch] = React.useState('');
  const [filterTemp, setFilterTemp] = React.useState<number | null>(null);

  const filtered = MATERIALS_CATALOG.filter((mat) => {
    const matchQuery =
      mat.code.toLowerCase().includes(search.toLowerCase()) ||
      mat.name.toLowerCase().includes(search.toLowerCase()) ||
      mat.description.toLowerCase().includes(search.toLowerCase());
    const matchTemp = filterTemp ? mat.maxTemp >= filterTemp : true;
    return matchQuery && matchTemp;
  });

  return (
    <div className="container space-y-10 py-12">
      <div className="max-w-3xl space-y-3">
        <Badge variant="outline">Matières & Propriétés</Badge>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Guide des Plastiques Techniques Usinables
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Sélectionnez le polymère adapté aux contraintes réelles de fonctionnement de vos machines
          : température, frottement, chocs et agents corrosifs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border bg-card/60 p-4 backdrop-blur sm:flex-row">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher POM-C, PTFE, PEEK, Delrin..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="mr-1 text-muted-foreground">Filtre Température :</span>
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
            key={mat.code}
            className="flex flex-col justify-between transition-all hover:border-primary/50"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-primary">{mat.code}</span>
                <Badge variant={mat.foodGrade ? 'success' : 'secondary'} className="text-[10px]">
                  {mat.foodGrade ? 'FDA Alimentaire' : 'Technique Industriel'}
                </Badge>
              </div>
              <CardTitle className="mt-1 text-base leading-tight">{mat.name}</CardTitle>
              <span className="font-mono text-xs text-muted-foreground">{mat.category}</span>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between space-y-4 text-sm">
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                {mat.description}
              </p>

              <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                <div>
                  <span className="block text-[10px] text-muted-foreground">DENSITÉ</span>
                  <span className="font-semibold text-foreground">{mat.density} g/cm³</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">T° MAX CONTINUE</span>
                  <span className="font-semibold text-foreground">{mat.maxTemp} °C</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">FROTTEMENT (µ)</span>
                  <span className="font-semibold text-foreground">{mat.frictionCoefficient}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">TRACTION</span>
                  <span className="font-semibold text-foreground">{mat.tensileStrength} MPa</span>
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
