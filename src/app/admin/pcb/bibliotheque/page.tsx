import { listCatalog } from '@/lib/pcb/catalog';
import { CatalogTable } from '@/components/pcb/CatalogTable';

export default async function BibliothequePage() {
  const components = await listCatalog();
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="mb-6 text-2xl font-bold">Bibliothèque de composants</h1>
      <CatalogTable initial={components} />
    </main>
  );
}
