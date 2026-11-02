export const CAD_EXTENSIONS = ['stl', 'step', 'stp', 'iges', 'igs', 'obj', '3mf'] as const;
export const PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;

export type CadExtension = typeof CAD_EXTENSIONS[number];
export type PhotoExtension = typeof PHOTO_EXTENSIONS[number];

export function getExtension(urlOrName: string): string | null {
  try {
    let path: string;
    if (urlOrName.includes('://')) {
      path = new URL(urlOrName).pathname;
    } else {
      path = urlOrName.split('?')[0]!.split('#')[0]!;
    }
    const match = path.match(/\.([a-zA-Z0-9]+)$/);
    if (!match) return null;
    return match[1]!.toLowerCase();
  } catch {
    return null;
  }
}

export function isCadFile(urlOrName: string): boolean {
  const ext = getExtension(urlOrName);
  if (ext === null) return false;
  return (CAD_EXTENSIONS as readonly string[]).includes(ext);
}

export function isPhotoFile(urlOrName: string): boolean {
  const ext = getExtension(urlOrName);
  if (ext === null) return false;
  return (PHOTO_EXTENSIONS as readonly string[]).includes(ext);
}
