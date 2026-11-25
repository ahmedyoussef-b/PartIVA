// Helpers client pour la création / réparation du fichier plateau KiCad.

export async function createKicadFile(projectId: string): Promise<string> {
  const res = await fetch(`/api/pcb/projects/${projectId}/board`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'open' }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    kicadFilePath?: string;
  };
  if (!res.ok || !data.ok || !data.kicadFilePath) {
    throw new Error(data.error ?? 'Création du fichier KiCad impossible');
  }
  window.dispatchEvent(new Event('pcb:board-refresh'));
  return data.kicadFilePath;
}

export async function repairKicadSync(projectId: string, kicadFilePath: string): Promise<void> {
  const res = await fetch(`/api/pcb/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kicadFilePath }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Réparation impossible');
  window.dispatchEvent(new Event('pcb:board-refresh'));
}
