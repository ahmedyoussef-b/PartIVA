'use client'

import * as React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { formatDate } from '@/lib/utils'
import { Search, PlusCircle, ArrowRight, Eye, Filter } from 'lucide-react'

export default function ClientDemandesPage() {
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const filtered = INITIAL_REQUESTS.filter((req) => {
    const matchSearch =
      req.partDescription.toLowerCase().includes(search.toLowerCase()) ||
      (req.machineRef && req.machineRef.toLowerCase().includes(search.toLowerCase())) ||
      (req.cloudId && req.cloudId.toString().includes(search))
    const matchStatus = statusFilter === 'all' ? true : req.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mes Demandes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Historique complet des pièces soumises pour modélisation et usinage CNC.
          </p>
        </div>
        <Link href="/demande">
          <Button className="gap-2 font-bold shadow-md">
            <PlusCircle className="w-4 h-4" />
            Nouvelle demande
          </Button>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-xl border bg-card/60 backdrop-blur">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par mot-clé, machine, référence..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('all')}
          >
            Toutes
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'searching' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('searching')}
          >
            Recherche
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'reverse_engineering' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('reverse_engineering')}
          >
            Reverse CAO
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'machining' ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter('machining')}
          >
            Usinage CNC
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Réf. Dossier</TableHead>
                <TableHead>Pièce & Description</TableHead>
                <TableHead>Machine d’origine</TableHead>
                <TableHead className="text-center">Qté</TableHead>
                <TableHead>Urgence</TableHead>
                <TableHead>Statut Actuel</TableHead>
                <TableHead>Date d’envoi</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((req) => (
                <TableRow key={req.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs font-bold text-primary">
                    {req.cloudId ? `#REQ-${req.cloudId}` : req.id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-xs line-clamp-1">{req.partDescription}</div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Matière : {req.suspectedMaterial || 'Non précisée'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {req.machineRef || '—'}
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">
                    {req.quantity}
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
                    <Badge variant="secondary" className="text-[10px] font-medium">
                      {FR.statuses[req.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(req.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/client/dashboard/demandes/${req.id}`}>
                      <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs">
                        <Eye className="w-3.5 h-3.5" />
                        Suivre
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
