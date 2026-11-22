import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PriceTotal } from '@/lib/pcb/price-total';

// Taux de conversion EUR → Dinar tunisien (DT). Ajuster selon le cours du jour.
const EUR_TO_TND = 3.3;

export function PriceCard({ total }: { total: PriceTotal }) {
  const isEur = total.currency === 'EUR';
  const displayTotal = isEur ? total.total * EUR_TO_TND : total.total;
  const displayCurrency = isEur ? 'DT' : total.currency;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Coût estimé</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {total.lineCount === 0 ? (
          <p className="text-xs text-muted-foreground">Aucun composant.</p>
        ) : (
          <>
            <p className="text-2xl font-semibold">
              {displayTotal.toFixed(2)} {displayCurrency}
            </p>
            <p className="text-xs text-muted-foreground">
              {total.pricedCount}/{total.lineCount} composant(s) valorisé(s)
            </p>
            {total.unpriced.length > 0 && (
              <p className="text-xs text-gray-500">
                Sans prix : {total.unpriced.slice(0, 5).join(', ')}
                {total.unpriced.length > 5 ? '…' : ''}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
