import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type FacetValue = { value: string; count: number };

export type FacetsResult = {
  total: number;
  materials: FacetValue[];
  statuses: FacetValue[];
};

interface FacetsPanelProps {
  facets: FacetsResult | null;
  loading: boolean;
  activeMaterial: string;
  activeStatus: string;
  onSelectMaterial: (value: string) => void;
  onSelectStatus: (value: string) => void;
}

export function FacetsPanel({
  facets,
  loading,
  activeMaterial,
  activeStatus,
  onSelectMaterial,
  onSelectStatus,
}: FacetsPanelProps) {
  if (loading) {
    return <p className="text-xs text-muted-foreground">Chargement des facettes…</p>;
  }

  if (!facets || (facets.materials.length === 0 && facets.statuses.length === 0)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {facets.materials.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Matériaux ({facets.materials.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5 p-3 pt-0">
            {facets.materials.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onSelectMaterial(m.value === activeMaterial ? '' : m.value)}
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  m.value === activeMaterial
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-muted/50'
                }`}
                aria-pressed={m.value === activeMaterial}
              >
                {m.value} <span className="opacity-70">({m.count})</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
      {facets.statuses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">Statuts ({facets.statuses.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5 p-3 pt-0">
            {facets.statuses.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onSelectStatus(s.value === activeStatus ? '' : s.value)}
                className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                  s.value === activeStatus
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-muted/50'
                }`}
                aria-pressed={s.value === activeStatus}
              >
                {s.value} <span className="opacity-70">({s.count})</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
