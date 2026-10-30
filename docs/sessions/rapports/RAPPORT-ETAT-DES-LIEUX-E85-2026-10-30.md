# RAPPORT-ETAT-DES-LIEUX-E85 — Détection Automatique du Type de Pièce

## §1 — Capacités de vision

- Groq : propose des modèles vision (Llama 3.2 Vision) via API, format base64/URL.
- Claude (Anthropic) : multimodal (Claude 3+), vision en entrée.
- Aucune clé API de vision configurée dans le projet.

## §2 — Dépendances

- `@huggingface/inference` / `@xenova/transformers` : non installés.
- Aucun modèle local de vision.

## §3 — Flux d'ingestion

- `src/core/ai-engine/skills/ingest/ingest.ts` : traite photos (URLs) et CAD, extrait formats. Pas de vision.
- Isolé et modifiable.

## §4 — Options

- Option A : Groq/Claude Vision pour détecter type de pièce. Faisable si clé API. Risque moyen (coût, latence).
- Option B : modèle local (lourd). Risque élevé.
- Option C : service payant (brise gratuité).
- Option D : report.

## §5 — Recommandation

Option A si clé vision disponible, sinon Option D (report).

## §6 — Modules isolés

- `ingest.ts` isolé. Un nouveau Skill `vision` possible.
