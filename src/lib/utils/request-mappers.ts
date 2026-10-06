import type { RequestWithRelations } from '@/lib/data/requests';
import type { RequestUrgency, RequestStatus } from '@/schemas/request';

export type { RequestWithRelations };

export type MappedRequest = {
  id: string;
  clientId?: string;
  machineRef?: string;
  partDescription: string;
  partFunction?: string;
  suspectedMaterial?: string;
  quantity: number;
  status: RequestStatus;
  urgency: RequestUrgency;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  client: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  projects: RequestWithRelations['projects'];
};

export function mapRequestToUi(request: RequestWithRelations): MappedRequest {
  const photos = Array.isArray(request.photos)
    ? request.photos.filter((p): p is string => typeof p === 'string')
    : [];

  return {
    id: request.id,
    clientId: request.clientId ?? undefined,
    machineRef: request.machineRef ?? undefined,
    partDescription: request.partDescription,
    partFunction: request.partFunction ?? undefined,
    suspectedMaterial: request.suspectedMaterial ?? undefined,
    quantity: request.quantity,
    status: request.status.toLowerCase() as RequestStatus,
    urgency: request.urgency.toLowerCase() as RequestUrgency,
    photos,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    client: {
      name: request.client?.name ?? 'Client inconnu',
      email: request.client?.email ?? '',
      company: undefined,
      phone: undefined,
    },
    projects: request.projects,
  };
}
