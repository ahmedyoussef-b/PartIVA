# RAPPORT-ETAT-DES-LIEUX-E86 — Recommandation de Matériaux

## §1 — Données matériaux

- Modèle `Material` dans prisma/schema.prisma (slug, code, name, category, density, maxTemp, tensileStrength, etc.).
- API `src/app/api/materials/route.ts` existe.

## §2 — Composants UI

- `AssistantZone.tsx` peut accueillir une section recommandation.
- `result.ingest` contient dimensions, detectedType, warnings.

## §3 — Capacités Groq

- Groq peut générer une recommandation textuelle à partir d'une description d'usage.

## §4 — Options

- Option A : règles déterministes (usage → matériau). Faisable, risque faible.
- Option B : génération Groq. Faisable, risque moyen.
- Option C : hybride. Recommandé.

## §5 — Modules isolés

- AssistantZone isolé et modifiable.

## §6 — Recommandation

Option C (hybride) pour E86-A.
