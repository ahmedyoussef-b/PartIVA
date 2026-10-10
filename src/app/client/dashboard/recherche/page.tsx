import { SearchBar } from '@/components/search-bar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Recherche — PartIVA',
};

export default function ClientRecherchePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recherche</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Recherche dans vos pièces (nom, description, références).
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moteur de recherche</CardTitle>
          <CardDescription>
            Saisissez au moins 2 caractères — les résultats apparaissent automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchBar />
        </CardContent>
      </Card>
    </div>
  );
}
