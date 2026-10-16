import { readFileSync } from 'fs';
import { resolve } from 'path';

interface DesktopRelease {
  version: string;
  filename: string;
  blob_url: string;
  size_bytes: number;
  sha256?: string;
  released_at?: string;
  notes?: string;
}

async function getReleases() {
  const releasesPath = resolve('docs/desktop-releases.json');
  const json = JSON.parse(readFileSync(releasesPath, 'utf8'));
  return ((json.releases || []) as DesktopRelease[]).map((r) => ({
    version: r.version,
    filename: r.filename,
    download_url: r.blob_url,
    size_bytes: r.size_bytes,
    sha256: r.sha256,
    released_at: r.released_at,
    notes: r.notes,
  }));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + ' Mo';
}

export default async function DesktopDownloadsPage() {
  const releases = await getReleases();
  return (
    <div className="container mx-auto py-6">
      <h1 className="mb-2 text-2xl font-semibold">Téléchargements Desktop</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Installeurs Windows pour PartIVA Desktop.
      </p>
      {releases.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucun installateur disponible pour le moment.
        </p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Version</th>
                <th className="p-2 text-left">Fichier</th>
                <th className="p-2 text-left">Taille</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">SHA256</th>
                <th className="p-2 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.version} className="border-b">
                  <td className="p-2">{r.version}</td>
                  <td className="p-2">{r.filename}</td>
                  <td className="p-2">{formatSize(r.size_bytes)}</td>
                  <td className="p-2">
                    {r.released_at ? new Date(r.released_at).toLocaleDateString('fr-FR') : ''}
                  </td>
                  <td className="p-2 font-mono text-xs">{r.sha256?.slice(0, 12)}…</td>
                  <td className="p-2">
                    <a href={r.download_url} className="text-blue-600 hover:underline">
                      Télécharger
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-muted-foreground mt-4 text-xs">
        Signature de code non disponible en V1 — un avertissement SmartScreen peut apparaître lors
        de l&apos;installation.
      </p>
    </div>
  );
}
