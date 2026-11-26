import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

/**
 * Helpers desktop Windows pour le plateau KiCad. Le mode web ne fait rien :
 * aucune fenêtre KiCad n'est ouverte par l'application dans ce cas.
 */

export function isDesktopKiCad(): boolean {
  return process.env.PARTIVA_DESKTOP === '1';
}

/// KiCad pose `~<fichier>.lck` tant que le plateau est ouvert.
export function isBoardOpenInKicad(absPath: string): boolean {
  return existsSync(path.join(path.dirname(absPath), `~${path.basename(absPath)}.lck`));
}

/**
 * Ferme gracieusement (WM_CLOSE, jamais taskkill) la fenêtre KiCad dont le titre
 * contient le nom du plateau. Le nom passe par une variable d'environnement
 * pour éviter toute injection dans le script PowerShell.
 */
export async function closeBoardInDesktop(
  absPath: string,
): Promise<{ closed: number; released: boolean }> {
  if (!isDesktopKiCad() || process.platform !== 'win32') {
    return { closed: 0, released: true };
  }
  const fileName = path.basename(absPath);
  const script = [
    '$name = $env:PARTIVA_BOARD_NAME',
    "if (-not $name) { Write-Output '0'; exit }",
    '$procs = @(Get-Process -ErrorAction SilentlyContinue | Where-Object {',
    "  ($_.ProcessName -ieq 'pcbnew' -or $_.ProcessName -ieq 'kicad') -and",
    '  $_.MainWindowTitle -and',
    '  $_.MainWindowTitle.IndexOf($name, [System.StringComparison]::OrdinalIgnoreCase) -ge 0',
    '})',
    '$closed = 0',
    'foreach ($p in $procs) { try { if ($p.CloseMainWindow()) { $closed++ } } catch {} }',
    'Write-Output ([string]$closed)',
  ].join('\n');

  let closed = 0;
  try {
    const result = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
      env: { ...process.env, PARTIVA_BOARD_NAME: fileName },
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    });
    closed = Number.parseInt(String(result.stdout ?? '').trim(), 10) || 0;
  } catch (e) {
    console.warn('[PCB:DESKTOP] fermeture KiCad impossible', e);
  }

  // On attend la suppression du `.lck` avant toute réécriture du fichier,
  // sinon l'état mémoire de KiCad peut écraser les changements externes.
  const lockPath = path.join(path.dirname(absPath), `~${path.basename(absPath)}.lck`);
  for (let i = 0; i < 20 && existsSync(lockPath); i++) {
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return { closed, released: !existsSync(lockPath) };
}

export function openBoardInDesktop(absPath: string): void {
  if (!isDesktopKiCad()) return;
  // Ne jamais ouvrir une seconde fenêtre sur un plateau déjà ouvert :
  // on laisse l'appelant utiliser reload/show pour rafraîchir.
  if (isBoardOpenInKicad(absPath)) return;
  try {
    if (process.platform === 'win32') {
      const child = spawn('cmd', ['/c', 'start', '', absPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
      return;
    }
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    const child = spawn(cmd, [absPath], { detached: true, stdio: 'ignore' });
    child.unref();
  } catch (e) {
    console.warn('[PCB:DESKTOP] ouverture KiCad impossible', e);
  }
}
