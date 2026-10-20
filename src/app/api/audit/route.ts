import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-admin';

const MAX_LOGS = 100;

type AuditEntityType = 'request' | 'part' | 'sync';

type AuditSeverity = 'info' | 'success' | 'warning';

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
  entityType: AuditEntityType;
  description: string;
  severity: AuditSeverity;
}

const VALID_ACTIONS: AuditAction[] = [
  'sync_pull',
  'request_received',
  'search_launched',
  'candidate_selected',
  'reverse_started',
  'machining_started',
  'completed',
];

function mapAction(dbAction: string): AuditAction {
  return VALID_ACTIONS.includes(dbAction as AuditAction) ? (dbAction as AuditAction) : 'completed';
}

function mapEntityType(dbEntityType: string): AuditEntityType {
  return ['request', 'part', 'sync'].includes(dbEntityType)
    ? (dbEntityType as AuditEntityType)
    : 'part';
}

function mapSeverity(value: unknown): AuditSeverity {
  return ['info', 'success', 'warning'].includes(value as string)
    ? (value as AuditSeverity)
    : 'info';
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  try {
    const logs = await prisma.auditLog.findMany({
      take: MAX_LOGS,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    const entries: AuditEntry[] = logs.map((log) => {
      const metadata = log.metadata as
        | { description?: string; actor?: string; severity?: unknown; [key: string]: unknown }
        | undefined;

      return {
        id: log.id,
        ts: log.createdAt.toISOString(),
        action: mapAction(log.action),
        actor: log.user?.email ?? metadata?.actor ?? 'système',
        entityId: log.entityId,
        entityType: mapEntityType(log.entityType),
        description: (metadata?.description as string | undefined) ?? log.action,
        severity: mapSeverity(metadata?.severity),
      };
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('[api/audit] Failed to fetch:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
