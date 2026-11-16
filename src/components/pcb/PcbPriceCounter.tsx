'use client';

export function PcbPriceCounter({ total, count }: { total: number; count: number }) {
  return (
    <div className="rounded border bg-white p-3 text-sm shadow-sm">
      <p className="font-semibold">Coût estimé</p>
      <p className="text-2xl font-bold">{total.toFixed(2)} €</p>
      <p className="text-gray-500">
        {count} composant{count > 1 ? 's' : ''}
      </p>
    </div>
  );
}
