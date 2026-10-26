'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Search,
  User,
  Database,
  RefreshCw,
  CheckCircle2,
  Wrench,
  Hammer,
} from 'lucide-react';
import { getAuditLogs } from '@/lib/data-client';
import AuthGuard from '@/lib/auth-guard';

type AuditAction =
  | 'sync_pull'
  | 'request_received'
  | 'search_launched'
  | 'candidate_selected'
  | 'reverse_started'
  | 'machining_started'
  | 'completed';

interface AuditEntry {
  id: string;
  ts: string;
  action: AuditAction;
  actor: string;
  entityId: string;
  entityType: 'request' | 'part' | 'sync';
  description: string;
  severity: 'info' | 'success' | 'warning';
}

const ACTION_CONFIG: Record<
  AuditAction,
  { label: string; icon: React.ElementType; color: string }
> = {
  sync_pull: { label: 'Sync Cloud', icon: RefreshCw, color: 'text-blue-500' },
  request_received: { label: 'Demande reçue', icon: Database, color: 'text-violet-500' },
  search_launched: { label: 'Recherche lancée', icon: Search, color: 'text-amber-500' },
  candidate_selected: { label: 'Candidat validé', icon: CheckCircle2, color: 'text-emerald-500' },
  reverse_started: { label: 'Reverse CAO', icon: Wrench, color: 'text-orange-500' },
  machining_started: { label: 'Usinage démarré', icon: Hammer, color: 'text-primary' },
  completed: { label: 'Dossier clôturé', icon: CheckCircle2, color: 'text-emerald-600' },
};

function AdminAuditPageContent() {
  const [query, setQuery] = React.useState('');
  const [auditLogs, setAuditLogs] = React.useState<AuditEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchAuditLogs() {
      try {
        const logs = await getAuditLogs();
        setAuditLogs(logs || []);
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLogs();
  }, []);

  const filtered = auditLogs.filter((entry) => {
    const q = query.toLowerCase();
    return (
      entry.description.toLowerCase().includes(q) ||
      entry.actor.toLowerCase().includes(q) ||
      entry.action.includes(q)
    );
  });

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Journal d&apos;Audit
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Traçabilité complète de toutes les actions métier et opérations système.
          </p>
        </div>
        <Button variant="outline" className="gap-2 text-xs">
          <FileSpreadsheet className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
        <Input
          placeholder="Filtrer les événements…"
          className="pl-9 text-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{filtered.length} événement(s)</CardTitle>
          <CardDescription className="text-xs">
            Log chronologique décroissant — toutes les opérations sensibles sont tracées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="bg-border absolute top-0 bottom-0 left-[18px] w-px" />

            <div className="space-y-0">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground text-sm">Chargement...</div>
                </div>
              ) : (
                filtered.map((entry, i) => {
                  const cfg = ACTION_CONFIG[entry.action];
                  const Icon = cfg.icon;
                  return (
                    <div key={entry.id} className="group relative flex gap-4">
                      {/* Dot */}
                      <div
                        className={`border-background z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                          entry.severity === 'success'
                            ? 'bg-emerald-500/15'
                            : entry.severity === 'warning'
                              ? 'bg-amber-500/15'
                              : 'bg-muted'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                      </div>

                      {/* Content */}
                      <div className={`flex-1 pb-6 ${i === filtered.length - 1 ? 'pb-0' : ''}`}>
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[9px]">
                            {cfg.label}
                          </Badge>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(entry.ts).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                            <User className="h-2.5 w-2.5" />
                            {entry.actor}
                          </span>
                        </div>
                        <p className="text-foreground text-xs leading-snug">{entry.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminAuditPage() {
  return (
    <AuthGuard>
      <AdminAuditPageContent />
    </AuthGuard>
  );
}


