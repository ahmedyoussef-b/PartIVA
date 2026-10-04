'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { INITIAL_PARTS } from '@/lib/mock-data'
import { KPICard } from '@/components/shared/kpi-card'
import { FilterBar } from '@/components/shared/filter-bar'
import { Search, Eye, FileDown } from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'critical' }> = {
  validated: { label: 'Validée', variant: 'default' },
  draft: { label: 'Brouillon', variant: 'outline' },
  archived: { label: 'Archivée', variant: 'secondary' },
}

export default function AdminPiecesPage() {
  const [search, setSearch] = React.useState('')
  const [matFilter, setMatFilter] = React.useState('all')

  const allMaterials = [...new Set(INITIAL_PARTS.map((p) => p.material))]

  const filtered = INITIAL_PARTS.filter((p) => {
    const q = search.toLowerCase()
    const matchSearch =
      p.name.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q) ||
      (p.description?.toLowerCase().includes(q) ?? false)
    const matchMat = matFilter === 'all' || p.material === matFilter
    return matchSearch && matchMat
  })

  const stats = {
    total: INITIAL_PARTS.length,
    validated: INITIAL_PARTS.filter((p) => p.status === 'validated').length,
    draft: INITIAL_PARTS.filter((p) => p.status === 'draft').length,
    withCad: INITIAL_PARTS.filter((p) => (p.files?.cad?.length ?? 0) > 0).length,
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue pièces</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pièces usinées, indexées et disponibles pour réutilisation.
          </p>
        </div>
        <Button className="gap-2 text-xs font-semibold">
          Nouvelle pièce
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total références" value={stats.total} />
        <KPICard title="Validées" value={stats.validated} variant="success" />
        <KPICard title="Brouillons" value={stats.draft} variant="warning" />
        <KPICard title="Avec CAO" value={stats.withCad} variant="info" />
      </div>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Référence, nom, description…"
        searchValue={search}
        onSearchChange={setSearch}
        filters={allMaterials.map((m) => ({ label: m, value: m }))}
        activeFilters={matFilter !== 'all' ? [matFilter] : []}
        onFilterChange={(val) => setMatFilter(val === matFilter ? 'all' : val)}
        onClearFilters={() => {
          setSearch('')
          setMatFilter('all')
        }}
      />

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Réf.</TableHead>
                <TableHead>Pièce</TableHead>
                <TableHead>Matière</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Fichiers</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((part) => {
                const st = STATUS_STYLES[part.status] ?? { label: part.status, variant: 'outline' as const }
                const hasCad = (part.files?.cad?.length ?? 0) > 0
                const hasPlan = (part.files?.plans?.length ?? 0) > 0
                return (
                  <TableRow key={part.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-primary">
                      {part.reference}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{part.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{part.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {part.material}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant} className="text-[10px]">
                        {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {hasCad && (
                          <Badge variant="outline" className="text-[9px] font-mono border-blue-500/40 text-blue-600">
                            CAO
                          </Badge>
                        )}
                        {hasPlan && (
                          <Badge variant="outline" className="text-[9px] font-mono border-violet-500/40 text-violet-600">
                            PLAN
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                          <Eye className="w-3.5 h-3.5" />
                          Voir
                        </Button>
                        {hasCad && (
                          <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                            <FileDown className="w-3.5 h-3.5" />
                            STEP
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
