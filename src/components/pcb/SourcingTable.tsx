'use client';

import { useState } from 'react';
import type { SourcingResult } from '@/lib/pcb/sourcing-engine';

interface SourcingTableProps {
  results: SourcingResult[];
}

export default function SourcingTable({ results }: SourcingTableProps) {
  const [expandedAlt, setExpandedAlt] = useState<string | null>(null);

  if (!results || results.length === 0) {
    return (
      <p className="text-gray-500 italic">Aucune donnée d&apos;approvisionnement disponible.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-700 uppercase">
          <tr>
            <th className="px-4 py-3">Réf</th>
            <th className="px-4 py-3">MPN Matché</th>
            <th className="px-4 py-3 text-right">Prix Unitaire</th>
            <th className="px-4 py-3 text-right">Stock</th>
            <th className="px-4 py-3 text-right">Coût Total</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {results.map((item) => {
            const hasMatch = item.matchedMpns.length > 0;
            const bestMatch = hasMatch ? item.matchedMpns[0] : null;

            return (
              <tr key={item.reference} className={hasMatch ? 'bg-white' : 'bg-yellow-50'}>
                <td className="px-4 py-3 font-mono font-medium">{item.reference}</td>
                <td className="px-4 py-3">
                  {bestMatch ? (
                    <span className="font-medium text-green-700">{bestMatch.mpn}</span>
                  ) : (
                    <span className="font-medium text-orange-600">Non trouvé</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {(bestMatch?.price ?? item.alternatives[0]?.price ?? 0).toFixed(2)} €
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {bestMatch?.stock ?? item.alternatives[0]?.stock ?? 0}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold">
                  {item.totalCost.toFixed(2)} €
                </td>
                <td className="px-4 py-3">
                  {item.isAvailable ? (
                    <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      ✓ Disponible
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      ✗ Rupture
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {item.alternatives.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAlt(expandedAlt === item.reference ? null : item.reference)
                      }
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      {expandedAlt === item.reference
                        ? 'Masquer'
                        : `${item.alternatives.length} alternative(s)`}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Section Alternatives Dépliée */}
      {results.map(
        (item) =>
          expandedAlt === item.reference &&
          item.alternatives.length > 0 && (
            <div key={`alt-${item.reference}`} className="border-t bg-gray-50 p-4">
              <h4 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                Alternatives pour {item.reference}
              </h4>
              <ul className="space-y-2">
                {item.alternatives.map((alt, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded border bg-white p-2 text-xs"
                  >
                    <div>
                      <span className="font-mono font-medium">{alt.mpn}</span>
                      <span className="ml-2 text-gray-500">{alt.name}</span>
                      <span className="ml-2 text-indigo-600">
                        (Similarité: {(alt.similarityScore * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono">{alt.price.toFixed(2)} €</span>
                      <span className={`ml-2 ${alt.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Stock: {alt.stock}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}
    </div>
  );
}
