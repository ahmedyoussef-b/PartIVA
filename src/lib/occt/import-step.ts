import oc from 'libcascade';
import type { TopoDS_Shape } from 'libcascade';
import { IFSelect_ReturnStatus } from 'libcascade';

export interface ImportResult {
  success: boolean;
  shape?: TopoDS_Shape;
  error?: string;
}

export function importCadFile(buffer: ArrayBuffer, format: 'step' | 'iges'): ImportResult {
  try {
    const tempPath = `/tmp/input.${format}`;

    const uint8 = new Uint8Array(buffer);
    oc.FS.writeFile(tempPath, uint8);

    let shape: TopoDS_Shape | null = null;

    if (format === 'step') {
      const reader = new oc.STEPControl_Reader();
      const status = reader.ReadFile(tempPath);
      if (status !== IFSelect_ReturnStatus.IFSelect_RetDone) {
        oc.FS.unlink(tempPath);
        return { success: false, error: `STEP read failed (status ${status})` };
      }
      reader.TransferRoots();
      shape = reader.OneShape();
    } else {
      const reader = new oc.IGESControl_Reader();
      const status = reader.ReadFile(tempPath);
      if (status !== IFSelect_ReturnStatus.IFSelect_RetDone) {
        oc.FS.unlink(tempPath);
        return { success: false, error: `IGES read failed (status ${status})` };
      }
      reader.TransferRoots();
      shape = reader.OneShape();
    }

    oc.FS.unlink(tempPath);

    if (!shape) {
      return { success: false, error: 'No shape extracted from file' };
    }

    console.log('[OCCT:import] Fichier importé', { format, path: tempPath });
    return { success: true, shape };
  } catch (err) {
    console.error('[OCCT:import] Erreur', err);
    return { success: false, error: (err as Error).message };
  }
}
