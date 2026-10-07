'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Layers,
  Thermometer,
  Zap,
  Droplets,
  ChefHat,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import type { MaterialWithDetails } from '@/lib/data/materials';

const MATERIAL_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  'POM-C': { accent: 'text-blue-500', bg: 'bg-blue-500/8', border: 'border-blue-500/20' },
  'UHMW-PE': { accent: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' },
  PTFE: { accent: 'text-violet-500', bg: 'bg-violet-500/8', border: 'border-violet-500/20' },
  PA6: { accent: 'text-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/20' },
  PEHD: { accent: 'text-cyan-500', bg: 'bg-cyan-500/8', border: 'border-cyan-500/20' },
  PEEK: { accent: 'text-rose-500', bg: 'bg-rose-500/8', border: 'border-rose-500/20' },
};

function getColor(code: string) {
  return (
    MATERIAL_COLORS[code] ?? {
      accent: 'text-primary',
      bg: 'bg-primary/8',
      border: 'border-primary/20',
    }
  );
}

function ResistanceBar({ label, value }: { label: string; value: string }) {
  const levels = ['Faible', 'Moyenne', 'Bonne', 'Excellente'];
  const idx = levels.indexOf(value);
  const pct = ((idx + 1) / levels.length) * 100;
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500'];
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${colors[idx] ?? 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface AdminMateriauxPageClientProps {
  initialMaterials: MaterialWithDetails[];
}

export default function AdminMateriauxPageClient({ initialMaterials }: AdminMateriauxPageClientProps) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const materials = React.useMemo(() => initialMaterials, [initialMaterials]);

  const selectedMat = materials.find((m) => m.slug === selected) ?? null;

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Plastiques Techniques</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Catalogue complet des matières usinées dans l&apos;atelier — propriétés, applications et aide à la sélection.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Material grid */}
        <div className="space-y-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {materials.length} matières en stock
          </p>
          {materials.map((mat) => {
            const col = getColor(mat.code);
            const isActive = selected === mat.slug;
            return (
              <button
                key={mat.id}
                onClick={() => setSelected(isActive ? null : mat.slug)}
                className={`w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                  isActive ? `${col.border} ${col.bg} shadow-sm` : 'border-border bg-card/60 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-md px-2 py-0.5 font-mono text-sm font-black ${col.bg} ${col.accent} border ${col.border}`}
                    >
                      {mat.code}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight text-foreground">{mat.name.split(' (')[0]}</div>
                      <div className="text-[10px] text-muted-foreground">{mat.category}</div>
                    </div>
                  </div>
                  <ArrowRight className={`h-4 w-4 transition-transform ${isActive ? 'rotate-90' : ''} ${col.accent}`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 font-mono text-[10px]">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Thermometer className="h-3 w-3" />
                    {mat.maxTemp}°C max
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    {mat.tensileStrength} MPa
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Droplets className="h-3 w-3" />
                    μ={mat.frictionCoefficient}
                  </span>
                  {mat.foodGrade && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <ChefHat className="h-3 w-3" />
                      Alimentaire
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selectedMat ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 py-24 text-center">
              <div className="rounded-full bg-muted p-4">
                <Layers className="h-8 w-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">Sélectionnez une matière pour afficher ses propriétés détaillées</p>
            </div>
          ) : (
            <Card className={`${getColor(selectedMat.code).border} ${getColor(selectedMat.code).bg}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg px-3 py-1 font-mono text-xl font-black ${getColor(selectedMat.code).accent} border bg-card ${getColor(selectedMat.code).border}`}
                  >
                    {selectedMat.code}
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold">{selectedMat.name}</CardTitle>
                    <CardDescription>{selectedMat.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs leading-relaxed text-muted-foreground">{selectedMat.description}</p>

                <Separator />

                {/* Properties grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Densité', value: `${selectedMat.density} g/cm³` },
                    { label: 'T° max continue', value: `${selectedMat.maxTemp}°C` },
                    { label: 'Résistance traction', value: `${selectedMat.tensileStrength} MPa` },
                    { label: 'Dureté', value: selectedMat.hardness },
                    { label: 'Coeff. frottement', value: `μ = ${selectedMat.frictionCoefficient}` },
                    {
                      label: 'Contact alimentaire',
                      value: selectedMat.foodGrade ? '✓ FDA / CE 1935' : '✗ Non certifié',
                    },
                  ].map((prop) => (
                    <div key={prop.label} className="rounded-lg border border-border/50 bg-background/60 p-3">
                      <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{prop.label}</div>
                      <div className="text-xs font-bold text-foreground">{prop.value}</div>
                    </div>
                  ))}
                </div>

                <ResistanceBar label="Résistance chimique" value={selectedMat.resistanceChemical ?? 'Moyenne'} />

                <Separator />

                {/* Advantages */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Avantages clés</h4>
                  <ul className="space-y-1.5">
                    {selectedMat.advantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${getColor(selectedMat.code).accent}`} />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Applications */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applications typiques atelier</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMat.commonApplications.map((app, i) => (
                      <span
                        key={i}
                        className={`inline-block rounded-md border px-2 py-1 text-[10px] ${getColor(selectedMat.code).border} ${getColor(selectedMat.code).accent} bg-background/60`}
                      >
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
