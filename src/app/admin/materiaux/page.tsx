'use client'

import * as React from 'react'
import { MATERIALS_CATALOG } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Layers,
  Thermometer,
  Zap,
  Droplets,
  ChefHat,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react'

const MATERIAL_COLORS: Record<string, { accent: string; bg: string; border: string }> = {
  'POM-C':     { accent: 'text-blue-500',    bg: 'bg-blue-500/8',    border: 'border-blue-500/20' },
  'UHMW-PE':   { accent: 'text-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' },
  'PTFE':      { accent: 'text-violet-500',  bg: 'bg-violet-500/8',  border: 'border-violet-500/20' },
  'PA6':       { accent: 'text-amber-500',   bg: 'bg-amber-500/8',   border: 'border-amber-500/20' },
  'PEHD':      { accent: 'text-cyan-500',    bg: 'bg-cyan-500/8',    border: 'border-cyan-500/20' },
  'PEEK':      { accent: 'text-rose-500',    bg: 'bg-rose-500/8',    border: 'border-rose-500/20' },
}

function getColor(code: string) {
  return MATERIAL_COLORS[code] ?? { accent: 'text-primary', bg: 'bg-primary/8', border: 'border-primary/20' }
}

function ResistanceBar({ label, value }: { label: string; value: string }) {
  const levels = ['Faible', 'Moyenne', 'Bonne', 'Excellente']
  const idx = levels.indexOf(value)
  const pct = ((idx + 1) / levels.length) * 100
  const colors = ['bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-emerald-500']
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors[idx] ?? 'bg-primary'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminMateriauxPage() {
  const [selected, setSelected] = React.useState<string | null>(null)

  const selectedMat = MATERIALS_CATALOG.find((m) => m.slug === selected)

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Plastiques Techniques
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Catalogue complet des matières usinées dans l'atelier — propriétés, applications et aide à la sélection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Material grid */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {MATERIALS_CATALOG.length} matières en stock
          </p>
          {MATERIALS_CATALOG.map((mat) => {
            const col = getColor(mat.code)
            const isActive = selected === mat.slug
            return (
              <button
                key={mat.slug}
                onClick={() => setSelected(isActive ? null : mat.slug)}
                className={`w-full text-left rounded-xl border p-4 transition-all hover:shadow-sm ${
                  isActive
                    ? `${col.border} ${col.bg} shadow-sm`
                    : 'border-border bg-card/60 hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded-md font-mono font-black text-sm ${col.bg} ${col.accent} border ${col.border}`}>
                      {mat.code}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground leading-tight">
                        {mat.name.split(' (')[0]}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{mat.category}</div>
                    </div>
                  </div>
                  <ArrowRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''} ${col.accent}`} />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Thermometer className="w-3 h-3" />
                    {mat.maxTemp}°C max
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    {mat.tensileStrength} MPa
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Droplets className="w-3 h-3" />
                    μ={mat.frictionCoefficient}
                  </span>
                  {mat.foodGrade && (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <ChefHat className="w-3 h-3" />
                      Alimentaire
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-3">
          {!selectedMat ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 rounded-xl border border-dashed bg-muted/20 py-24">
              <div className="p-4 rounded-full bg-muted">
                <Layers className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sélectionnez une matière pour afficher ses propriétés détaillées
              </p>
            </div>
          ) : (
            <Card className={`${getColor(selectedMat.code).border} ${getColor(selectedMat.code).bg}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-lg font-mono font-black text-xl ${getColor(selectedMat.code).accent} bg-card border ${getColor(selectedMat.code).border}`}>
                    {selectedMat.code}
                  </span>
                  <div>
                    <CardTitle className="text-base font-bold">{selectedMat.name}</CardTitle>
                    <CardDescription>{selectedMat.category}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedMat.description}
                </p>

                <Separator />

                {/* Properties grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    <div key={prop.label} className="bg-background/60 rounded-lg p-3 border border-border/50">
                      <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                        {prop.label}
                      </div>
                      <div className="text-xs font-bold text-foreground">{prop.value}</div>
                    </div>
                  ))}
                </div>

                <ResistanceBar label="Résistance chimique" value={selectedMat.resistanceChemical} />

                <Separator />

                {/* Advantages */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Avantages clés
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedMat.advantages.map((adv, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${getColor(selectedMat.code).accent}`} />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Applications */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Applications typiques atelier
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedMat.commonApplications.map((app, i) => (
                      <span
                        key={i}
                        className={`inline-block text-[10px] px-2 py-1 rounded-md border ${getColor(selectedMat.code).border} ${getColor(selectedMat.code).accent} bg-background/60`}
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
  )
}
