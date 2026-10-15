'use client';

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

type PartDetail = {
  part: {
    id: string;
    part_number: string;
    name: string;
    description: string | null;
    material: string | null;
    status: string;
    updated_at: string;
  };
  specifications: { key: string; value: string; unit: string | null }[];
  images: { url: string; alt_text: string | null; is_primary: number }[];
  fitments: { vehicle_make: string; vehicle_model: string; vehicle_year: number }[];
};

/**
 * E8P-S06 — Fiche pièce (Bloc H) : route par query param /part?id=xxx
 * (les routes dynamiques [id] sont incompatibles avec output: 'export').
 */
export default function PartPage() {
  const [detail, setDetail] = useState<PartDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) {
        setError('Identifiant de pièce manquant.');
        return;
      }
      try {
        const d = await invoke<PartDetail>('get_part', { id });
        setDetail(d);
      } catch {
        setError('Pièce introuvable dans la base locale.');
      }
    })();
  }, []);

  if (error) return <main className="center error">{error}</main>;
  if (!detail) return <main className="center">Chargement…</main>;

  const { part, specifications, images, fitments } = detail;
  return (
    <main>
      <p>
        <a href="/catalogue/">← Catalogue</a>
      </p>
      <h1>
        {part.name} <small>{part.part_number}</small>
      </h1>
      {part.description && <p>{part.description}</p>}
      <p className="meta">
        {part.material ?? '—'} · {part.status} · maj {part.updated_at?.slice(0, 10)}
      </p>

      <h2>Images</h2>
      {images.length === 0 && <p>Aucune image.</p>}
      <div className="images">
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- desktop offline-first : next/image inadapté (URLs Cloudinary externes, images unoptimized, export statique)
          <img key={i} src={img.url} alt={img.alt_text ?? part.name} />
        ))}
      </div>

      <h2>Spécifications</h2>
      {specifications.length === 0 && <p>Aucune spécification.</p>}
      {specifications.length > 0 && (
        <table className="parts-table">
          <tbody>
            {specifications.map((s, i) => (
              <tr key={i}>
                <td>{s.key}</td>
                <td>
                  {s.value}
                  {s.unit ? ` ${s.unit}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Compatibilités véhicules</h2>
      {fitments.length === 0 && <p>Aucun fitment enregistré.</p>}
      {fitments.length > 0 && (
        <ul>
          {fitments.map((f, i) => (
            <li key={i}>
              {f.vehicle_make} {f.vehicle_model} ({f.vehicle_year})
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
