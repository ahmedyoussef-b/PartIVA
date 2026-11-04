# D-ENGINE-GROQ-PROOF-options — Fiche de décision d’observabilité Groq (V1.3-C)

## Rappel du fait
- `src/app/api/engine/route.ts:23-41` : en mode `deep`, si `searchStatus ∈ {partial, not_found}`, appel à `callGroq` avec description enrichie puis relance `runEngine`.
- `src/app/api/engine/route.ts:44` : `const resultPayload = { success: true, ...result };` où `result = { ingest, search, reconstruct, archive }`. **Aucun indicateur observable** prouvant l’appel Groq.
- `src/lib/actions/reverse-engineering.ts:analyzeReverseEngineeringProject` (Server Action) retourne un résumé sans champ Groq.
- Dette tracée : `D-ENGINE-GROQ-PROOF`.

## Interdiction V1.3
Aucune modification de `/api/engine`, `/api/ai/chat`, `groq-client.ts` ou de la Server Action. Cette fiche est **uniquement une décision**.

## Options

| Option | Description | Impact code | Coût | Risque de régression | Phase cible | Test E2E honnête (sans mock) ? | Remarques |
|---|---|---|---|---|---|---|---|
| **1) Ajouter `groqUsed: true` dans le payload `/api/engine`** | Ajouter `groqUsed: boolean` (et éventuellement `groqModel`) au `resultPayload`. Ne compter que lorsque l’enrichissement est réellement effectué. | Faible/modéré (route + typage EngineResult consommé par UI/tests) | Faible | Moyen (contrat API public consommé par `WorkspaceClient`, tests existants). Nécessite cohérence avec `success`. | V1.5 | **Oui** si tracé uniquement quand appelé. Nécessite de ne pas l’injecter à tort. | Plus direct. Peut impacter tout consommateur. À typer strictement. |
| **2) Tracer dans `SearchHistory`** | Enregistrer un indicateur (ex. `metadata.groqEnriched: true`, ou champ dédié si existant) lors de l’enrichissement. | Faible (route + modèle Prisma si ajout champ — **éviter ajout champ si lourd**) | Faible | Faible si champ JSON/metadata existant. Moyen si migration. | V1.5 | **Partiel** — nécessite lecture DB / endpoint admin ou inspection, pas directement depuis la réponse HTTP du client. | Utile pour traçabilité, moins direct pour un test E2E UI/API simple. |
| **3) Log structuré `[ENGINE-GROQ]` + `E2E-API-CHECK`** | Émettre un log structuré côté serveur lors de l’appel Groq effectif. Le harness E2E-API-CHECK pourrait l’observer, ou un test dédié pourrait le capturer. | Très faible (log uniquement) | Très faible | Très faible (pas de changement de contrat API). | V1.5 | **Possible** mais dépend de l’observabilité E2E (capture logs serveur). Moins « contractuel » qu’un champ HTTP. | Respecte strictement « pas de faux-semblant », sans impacter les consommateurs. |
| **4) Header de réponse `x-groq-used: true/false`** | Ajouter un header HTTP (seulement quand pertinent). | Très faible | Très faible | Très faible (les clients ignorent les headers). Ne modifie pas le JSON. | V1.5 | **Oui** — facilement vérifiable par `page.waitForResponse` / `fetch`. | Discret, non cassant, testable proprement. À s’assurer qu’il n’est pas exposé inutilement. |

## Recommandation motivée (une seule)
**Recommandation : Option 4 — `x-groq-used: true/false`**.

Justification (anti-faux-semblant) :
- **Non-cassant** : n’altère pas le schéma `{ success: true, ...result }` consommé par l’existant (Workspace, tests). Réduit le risque de régression.
- **Vérifiable proprement en E2E** : `response.headers()` permet de prouver l’événement sans mocker `callGroq` ni modifier l’UI pour afficher un champ factice.
- **Précis** : peut être positionné uniquement au moment où l’enrichissement Groq est **réellement exécuté** (après `getGroqApiKey()` + `callGroq()` réussi/initié selon convention).
- **Cohérent avec v4** : privilégie une preuve observable sans faux-semblant (leçon 11). Si on ne peut pas prouver, on ne teste pas — ici on rendrait la preuve possible proprement.

Alternative acceptable : Option 3 (logs) si l’infra E2E préfère ne pas ajouter de header. Option 1 reste la plus explicite côté contrat, mais plus invasive.

## Décision
**non tranchée — à valider par le Superviseur en phase V1.5 ou V2.**

Aucune des options n’est implémentée dans V1.3. V1.3 se limite à tracer la décision (ce document). Aucune modification de code de production.
