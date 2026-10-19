/**
 * Fixtures 3DCarParts — mock (E15-R1).
 *
 * 3DCarParts n'a pas d'API publique connue (analyse E13-R0).
 * Les modèles 3D sont sous licence CC BY-SA 4.0 (attribution obligatoire).
 * Pas de scraping (CGU).
 *
 * Mode mock : fixtures statiques. Mode réel : à provisionner (post-E15).
 */

export interface ThreeDCarPartMockProduct {
  id: string;
  name: string;
  vehicle: { make: string; model: string; year: number };
  printableModelUrl: string;
  printMaterial: string;
  license: string;
  attribution: string;
  downloads: number;
  safetyWarning?: string;
}

export const MOCK_3DCARPARTS_PRODUCTS: ThreeDCarPartMockProduct[] = [
  {
    id: '3dcp-001',
    name: 'Dash Cubby',
    vehicle: { make: 'Chevrolet', model: 'Silverado', year: 2003 },
    printableModelUrl: 'https://example.com/models/dash-cubby.stl',
    printMaterial: 'ABS',
    license: 'CC BY-SA 4.0',
    attribution: 'HotRodNerd (Thingiverse)',
    downloads: 59,
  },
  {
    id: '3dcp-002',
    name: 'Grille Insert',
    vehicle: { make: 'Ford', model: 'F-150', year: 2015 },
    printableModelUrl: 'https://example.com/models/grille-insert.stl',
    printMaterial: 'ASA',
    license: 'CC BY-SA 4.0',
    attribution: 'TruckMods (Thingiverse)',
    downloads: 142,
    safetyWarning: 'Non structurel — usage décoratif uniquement.',
  },
];