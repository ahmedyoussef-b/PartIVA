# Audit E37 - Inventaire des données mockées/hardcodées

Date: 2026-10-24
Statut: En cours / Phase 1 uniquement

## Objectif
Inventaire exhaustif des mocks, données hardcodées ou valeurs factices dans src/ (hors prisma/seed.ts, hors e2e/).

## Méthodologie
Recherche par patterns: mock, fake, dummy, TODO.*real data, tableaux hardcodés dans composants/pages, imports depuis *mock*, *fake-data*, constantes hardcodées suspectes.

## Résultats

| # | Fichier | Ligne(s) | Type Mock | Usage | Criticité | Source Réelle Possible | Notes |
|---|---------|----------|-----------|-------|-----------|-------------------------|-------|
| 1 | src/app/(auth)/register/page.tsx | 78 | mock/fake/hardcoded | name="fakeusernameremembered" | Moyenne | À évaluer | Champs autocomplete/register mock |
| 2 | src/app/(auth)/register/page.tsx | 85 | mock/fake/hardcoded | name="fakepasswordremembered" | Moyenne | À évaluer | Champs autocomplete/register mock |
| 3 | src/lib/connectors/3dcarparts.ts | 11 | mock/fake/hardcoded | Mode mock (pas d'API publique) — mode réel post-E15. | Faible | À évaluer | Connecteur fallback/mock |
| 4 | src/lib/connectors/aggregator.ts | 207 | mock/fake/hardcoded | En mode mock, la photo est ignorée (pas d'embedding mock) — | Faible | À évaluer | Logique fallback |
| 5 | src/lib/connectors/tecdoc.ts | 16 | mock/fake/hardcoded | (filtre `includes` en mode mock, API TecDoc en mode réel). | Faible | À évaluer | Connecteur fallback/mock |
| 6 | src/lib/connectors/tecdoc.ts | 18 | mock/fake/hardcoded | Mode mock actif (D-tecdoc-credentials) : | Faible | À évaluer | Connecteur fallback/mock |
| 7 | src/lib/connectors/tecdoc.ts | 19 | mock/fake/hardcoded | isAvailable() retourne true — le mode mock est | Faible | À évaluer | Connecteur fallback/mock |
| 8 | src/lib/connectors/tecdoc.ts | 36 | mock/fake/hardcoded | timeoutMs: SOURCE_WEIGHTS.tecdoc.timeoutMs, // mock rapide, réel à ajuster | Faible | À évaluer | Commentaire |
| 9 | src/lib/connectors/tecdoc.ts | 222 | mock/fake/hardcoded | En mode mock, la photo est ignorée (pas d'embedding mock) — | Faible | À évaluer | Logique fallback |
| 10 | src/lib/connectors/traceparts.ts | 10 | mock/fake/hardcoded | (filtre `includes` en mode mock, API REST v3 en mode réel). | Faible | À évaluer | Connecteur fallback/mock |
| 11 | F | \PartIVA\src\lib\connectors\traceparts.ts | mock/fake/hardcoded | 12: * Mode mock actif (D-traceparts-credentials) : | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 12 | F | \PartIVA\src\lib\connectors\traceparts.ts | mock/fake/hardcoded | 13: * isAvailable() retourne true — le mode mock est | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 13 | F | \PartIVA\src\lib\connectors\traceparts.ts | mock/fake/hardcoded | 23: timeoutMs: SOURCE_WEIGHTS.traceparts.timeoutMs, // mock  | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 14 | F | \PartIVA\src\lib\connectors\types.ts | mock/fake/hardcoded | 25: * (référentiel automobile, mock — contrat commercial req | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 15 | F | \PartIVA\src\lib\connectors\types.ts | mock/fake/hardcoded | 40: * Retourne false si la source est en mode mock non fonct | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 16 | F | \PartIVA\src\lib\data\3dcarparts-fixtures.ts | mock/fake/hardcoded | 2: * Fixtures 3DCarParts — mock (E15-R1). | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 17 | F | \PartIVA\src\lib\data\3dcarparts-fixtures.ts | mock/fake/hardcoded | 8: * Mode mock : fixtures statiques. Mode réel : à provision | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 18 | F | \PartIVA\src\lib\data\3dcarparts-fixtures.ts | mock/fake/hardcoded | 11: export interface ThreeDCarPartMockProduct { | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 19 | F | \PartIVA\src\lib\data\3dcarparts-fixtures.ts | mock/fake/hardcoded | 23: export const MOCK_3DCARPARTS_PRODUCTS: ThreeDCarPartMock | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 20 | F | \PartIVA\src\lib\data\3dcarparts.ts | mock/fake/hardcoded | 2: import { MOCK_3DCARPARTS_PRODUCTS } from './3dcarparts-fi | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 21 | F | \PartIVA\src\lib\data\3dcarparts.ts | mock/fake/hardcoded | 10: * Mode mock : fixtures statiques (pas d'API publique). | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 22 | F | \PartIVA\src\lib\data\3dcarparts.ts | mock/fake/hardcoded | 46: const filtered = MOCK_3DCARPARTS_PRODUCTS.filter( | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 23 | F | \PartIVA\src\lib\data\3dcarparts.ts | mock/fake/hardcoded | 62: return false; // Mode mock uniquement (pas d'API publiqu | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 24 | F | \PartIVA\src\lib\data\elta.ts | mock/fake/hardcoded | 13: * gratuit). Mode mock : les fixtures respectent ce schém | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 25 | F | \PartIVA\src\lib\data\elta.ts | mock/fake/hardcoded | 64: * Fixtures mock — utilisées quand l'accès ELTA est absen | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 26 | F | \PartIVA\src\lib\data\elta.ts | mock/fake/hardcoded | 68: * (inscription gratuite). Le mock est un connecteur init | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 27 | F | \PartIVA\src\lib\data\elta.ts | mock/fake/hardcoded | 72: const MOCK_PRODUCTS: EltaProduct[] = [ | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 28 | F | \PartIVA\src\lib\data\elta.ts | mock/fake/hardcoded | 118: * Recherche ELTA — mode mock par défaut. | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 29 | F | \PartIVA\src\lib\data\elta.ts | mock/fake/hardcoded | 134: const filtered = MOCK_PRODUCTS.filter( | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 30 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 4: * Fixtures TecDoc mock enrichies (E6-S08). | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 31 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 13: * Mode mock uniquement (D-tecdoc-credentials) — le mode  | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 32 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 17: export interface TecDocMockProduct { | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 33 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 35: export interface TecDocMockVehicle { | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 34 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 45: export interface TecDocMockFitment { | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 35 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 53: export const MOCK_PRODUCTS: TecDocMockProduct[] = [ | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 36 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 901: export const MOCK_VEHICLES: TecDocMockVehicle[] = [ | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 37 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 1131: export const MOCK_FITMENTS: TecDocMockFitment[] = [ | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 38 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 1267: products: MOCK_PRODUCTS, | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 39 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 1268: vehicles: MOCK_VEHICLES, | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 40 | F | \PartIVA\src\lib\data\tecdoc-fixtures.ts | mock/fake/hardcoded | 1269: fitments: MOCK_FITMENTS, | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 41 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 4: MOCK_PRODUCTS, | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 42 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 5: MOCK_VEHICLES, | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 43 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 6: MOCK_FITMENTS, | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 44 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 25: * Mode mock : les fixtures respectent ce schéma. | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 45 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 42: // E14-R1 — enrichissement mock (3D / sécurité, optionne | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 46 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 101: * mock fournit des produits exploitables et instantanés | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 47 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 129: * Recherche TecDoc — mode mock par défaut. | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 48 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 145: const filtered = MOCK_PRODUCTS.filter( | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 49 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 214: * Décodage VIN (mock) → véhicule (make, model, year, en | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 50 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 217: * Mode mock : recherche exacte sur le VIN des fixtures. | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 51 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 233: MOCK_VEHICLES.find((v) => (v.vin ?? '').toUpperCase() = | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 52 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 245: const vehicleFitments = MOCK_FITMENTS.filter((f) => f.v | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 53 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 247: const products = MOCK_PRODUCTS.filter((p) => productIds | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 54 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 314: const vehicles = MOCK_VEHICLES.filter( | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 55 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 334: const fitments = MOCK_FITMENTS.filter((f) => vehicleIds | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 56 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 337: let products = MOCK_PRODUCTS.filter((p) => productIds.h | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 57 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 396: * Mode mock : la photo est ignorée (pas de modèle d'emb | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 58 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 397: * dans le mock) — le fitment véhicule est le filtre pri | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 59 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 400: * @param photo - Photo base64 (JPEG/PNG, ignorée en moc | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 60 | F | \PartIVA\src\lib\data\tecdoc.ts | mock/fake/hardcoded | 415: // Mode mock : la photo n'est pas analysée (pas d'embed | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 61 | F | \PartIVA\src\lib\data\traceparts.ts | mock/fake/hardcoded | 9: * Mode mock : les fixtures respectent ce schéma. | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 62 | F | \PartIVA\src\lib\data\traceparts.ts | mock/fake/hardcoded | 53: * Fixtures mock — utilisées quand les credentials sont a | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 63 | F | \PartIVA\src\lib\data\traceparts.ts | mock/fake/hardcoded | 56: const MOCK_PRODUCTS: TracePartsProduct[] = [ | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 64 | F | \PartIVA\src\lib\data\traceparts.ts | mock/fake/hardcoded | 138: * Recherche TraceParts — mode mock par défaut. | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 65 | F | \PartIVA\src\lib\data\traceparts.ts | mock/fake/hardcoded | 153: const filtered = MOCK_PRODUCTS.filter((p) => | Moyenne | À évaluer | Connecteur/fixtures/fallback |
| 66 | F | \PartIVA\src\lib\scoring\weights.ts | mock/fake/hardcoded | 15: *    - tecdoc = 0.5 (référentiel automobile, mock — | Moyenne | À évaluer | Connecteur/fixtures/fallback |

## Statistiques
- Total entrées trouvées (recherche): ~66 occurrences
- Majorité dans connecteurs/fixtures (mode mock/fallback) - Faible
- Quelques occurrences dans auth/register (Moyenne) - à valider (attributs autocomplete)
- Hors scope: prisma/seed.ts, e2e/ (non scannés/modifiés)

## Recommandations
1. **Priorité Haute**: aucun mock utilisateur visible en production évident détecté; à re-vérifier par parcours UI
2. **Priorité Moyenne**: valider les attributs `fake*` dans register (peuvent rester pour UX/autocomplete)
3. **Priorité Faible**: connecteurs avec mode mock/fixtures - garder en l'état tant que mode réel non provisionné
