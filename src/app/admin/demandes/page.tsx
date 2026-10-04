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
import { INITIAL_REQUESTS } from '@/lib/mock-data'
import { FR } from '@/i18n/fr'
import { FilterBar } from '@/components/shared/filter-bar'
import { Search } from 'lucide-react'

const STATUS_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'searching', label: 'En recherche' },
  { value: 'candidate_found', label: 'Candidat ≥70%' },
  { value: 'reverse_engineering', label: 'Reverse CAO' },
  { value: 'machining', label: 'Usinage' },
]

export default function AdminDemandesPage() {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('all')

  const filtered = INITIAL_REQUESTS.filter((req) => {
    const matchSearch =
      req.partDescription.toLowerCase().includes(search.toLowerCase()) ||
      req.client.name.toLowerCase().includes(search.toLowerCase()) ||
      (req.client.company && req.client.company.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' ? true : req.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">File de fabrication</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Recherche multi-sources → Validation → Usinage CNC.
        </p>
      </div>

      <FilterBar
        searchPlaceholder="Rechercher par client, machine, description..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={STATUS_FILTERS}
        activeFilters={statusFilter !== 'all' ? [statusFilter] : []}
        onFilterChange={(val) => setStatusFilter(val === statusFilter ? 'all' : val)}
        onClearFilters={() => {
          setSearch('')
          setStatusFilter('all')
        }}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Réf.</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Pièce</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {req.cloudId ? `#REQ-${req.cloudId}` : req.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-xs">{req.client.company || req.client.name}</div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-xs line-clamp-1">{req.partDescription}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={req.urgency === 'critical' ? 'critical' : 'outline'}
                      className="text-[10px]"
                    >
                      {FR.urgencies[req.urgency]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {FR.statuses[req.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/demandes/${req.id}/recherche`}>
                        <Button size="sm" className="h-8 gap-1 text-xs">
                          <Search className="w-3.5 h-3.5" />
                          Recherche
                        </Button>
                      </Link>
                      <Link href={`/admin/demandes/${req.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 text-xs">
                          Détails
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
