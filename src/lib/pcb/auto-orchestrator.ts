// Auto Orchestrator — pipeline séquentiel sans intervention utilisateur
// Mode automatique (V8-D-9) — avec persistance checkpoints via API

interface CadFileData {
  id: string;
}

interface PcbData {
  components: unknown[];
  nets: unknown[];
}

export interface AutoStep {
  id: string;
  label: string;
  apiEndpoint: string;
  payloadBuilder: (data: CadFileData | PcbData | unknown) => unknown;
}

export interface CheckpointData {
  projectId: string;
  stepId: string;
  status: 'running' | 'success' | 'error';
  payload: unknown;
}

export const AUTO_PIPELINE: AutoStep[] = [
  {
    id: 'analysis',
    label: 'Analyse CAO',
    apiEndpoint: '/api/reverse-engineering/analyze',
    payloadBuilder: (cadFile) => ({ fileId: (cadFile as CadFileData).id }),
  },
  {
    id: 'design-review',
    label: 'Revue de conception',
    apiEndpoint: '/api/pcb/design-review',
    payloadBuilder: (analysisResult) => {
      const d = analysisResult as PcbData;
      return { components: d.components, nets: d.nets };
    },
  },
  {
    id: 'autoroute',
    label: 'Autoroutage assisté',
    apiEndpoint: '/api/pcb/autoroute',
    payloadBuilder: (reviewResult) => {
      const d = reviewResult as PcbData;
      return { components: d.components, nets: d.nets };
    },
  },
];

async function saveCheckpoint(data: CheckpointData) {
  try {
    await fetch('/api/pcb/checkpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: data.projectId,
        label: `auto-${data.stepId}`,
        snapshot: JSON.stringify({
          stepId: data.stepId,
          status: data.status,
          payload: data.payload,
          savedAt: new Date().toISOString(),
        }),
      }),
    });
  } catch (err) {
    console.error(`[AUTO-CHECKPOINT] Échec sauvegarde ${data.stepId}:`, err);
    // Ne pas bloquer le pipeline pour une erreur de log/checkpoint
  }
}

export async function runAutoPipeline(
  initialData: unknown & { projectId?: string },
  onProgress: (step: string, status: string) => void,
) {
  let currentData: unknown = initialData;
  const projectId =
    (initialData as { projectId?: string }).projectId || 'auto-session-' + Date.now();

  for (const step of AUTO_PIPELINE) {
    // 1. Marquer comme running
    onProgress(step.id, 'running');
    await saveCheckpoint({ projectId, stepId: step.id, status: 'running', payload: currentData });

    try {
      const payload = step.payloadBuilder(currentData);
      const res = await fetch(step.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Échec étape ${step.id}: ${res.statusText}`);

      currentData = await res.json();

      // 2. Marquer comme success
      onProgress(step.id, 'success');
      await saveCheckpoint({ projectId, stepId: step.id, status: 'success', payload: currentData });
    } catch (error) {
      // 3. Marquer comme error
      onProgress(step.id, 'error');
      await saveCheckpoint({
        projectId,
        stepId: step.id,
        status: 'error',
        payload: { error: error instanceof Error ? error.message : String(error) },
      });
      throw error;
    }
  }

  return currentData;
}
