# 📋 RAPPORT DE SESSION — E5-S04 (OpenSERP — inadapté au périmètre)

**Session :** E5-S04 (E3-S03-bis — OpenSERP réel OSS)
**Date :** 2026-10-12
**Exécutant :** Kilo Code (IA interne)
**Statut :** 🔴 **BLOQUÉE — inadaptée au périmètre** (OpenSERP est un moteur SERP web, pas un catalogue de pièces)
**Commit de référence :** `e96951c` (E5-S05)

---

## Bloc 0 — Vérification conteneur + reconnaissance (R.5.1)

### 0.1 Docker provisionné ✅

| Vérification | Résultat |
|---|---|
| Docker CLI | ✅ Fonctionnel |
| Image `karust/openserp:latest` | ✅ Présente (pull OK) |
| Conteneur `openserp` | ✅ `Up (healthy)`, port 7000→7000 |

**Docker est provisionné** (par le Coordinateur). La dépendance Docker est **résolue**.

### 0.2 Reconnaissance OpenSERP — **DÉCOUVERTE CRITIQUE**

**`/health` (port 7000) :**
```json
{
  "status": "healthy",
  "engines": [
    {"name": "google", "initialized": true, "status": "ready"},
    {"name": "yandex", "initialized": true, "status": "ready"},
    {"name": "baidu", "initialized": true, "status": "ready"},
    {"name": "bing", "initialized": true, "status": "ready"},
    {"name": "duckduckgo", "initialized": true, "status": "ready"},
    {"name": "ecosia", "initialized": true, "status": "ready"}
  ],
  "system": {"go_version": "go1.24.6", "goroutines": 7, "memory_mb": 28}
}
```

**Doc officielle (github.com/karust/openserp) :**
> « Self-hosted SERP API for AI, SEO & automation. Browser-rendered **Google, Bing, Yandex, Baidu, DuckDuckGo and Ecosia search** with page extraction. »

**Endpoints :**
- `/google/search?text=...` — recherche Google
- `/mega/search?text=...` — méga-recherche multi-moteurs
- `/bing/image?text=...` — recherche d'images
- `/extract?url=...` — extraction de page web

**Format de réponse (exemple officiel) :**
```json
{
  "results": [{
    "title": "The Go Programming Language",
    "url": "https://go.dev/",
    "snippet": "Get Started Playground Tour...",
    "domain": "go.dev",
    "engine": "bing"
  }]
}
```

### 0.3 Verdict — **OpenSERP n'est PAS une source de pièces industrielles**

| Critère | OpenSERP | SourceConnector requis |
|---|---|---|
| Nature | Moteur SERP **web** (Google, Bing, ...) | Catalogue de **pièces industrielles** |
| Résultats | Pages web (titre, URL, snippet) | Pièces (référence, fabricant, CAD) |
| Champs | `title`, `url`, `snippet`, `domain`, `engine` | `partNumber`, `manufacturer`, `cadAvailable`, `category` |
| Mapping `SearchCandidate` | ❌ **Impossible** (pas de pièce structurée) | ✅ Requis |

**Conclusion :** OpenSERP **ne peut pas** être un `SourceConnector` de pièces industrielles. Le mapping `mapOpenSerpToCandidate` n'a **pas de sens** — une réponse SERP web ne contient ni référence de pièce, ni fabricant, ni CAD.

---

## Bloc A — Analyse de l'erreur de cadrage

### A.1 Origine (E3-S01)

E3-S01 (reconnaissance APIs) a retenu OpenSERP comme « source externe » en supposant à tort que c'était un **catalogue de pièces**. En réalité, c'est un **moteur de recherche web générique** (SERP = Search Engine Results Page).

### A.2 Pourquoi l'erreur n'a pas été détectée plus tôt

- E3-S03-bis (OpenSERP) a été **bloquée par Docker** dès E3 — l'instance n'a jamais été interrogée
- Le blocage Docker a **masqué** l'inadéquation fondamentale : même avec Docker, OpenSERP ne fournit pas de pièces
- La découverte n'est possible qu'avec l'instance **démarrée** (Bloc 0 E5-S04)

### A.3 Usage théorique (rejeté)

OpenSERP pourrait théoriquement rechercher des pièces sur le web (requête « M8x30 bearing » → résultats web), mais :
1. Les résultats sont des **pages web**, pas des pièces structurées
2. Le mapping vers `SearchCandidate` nécessiterait un **NLP de parsing** de pages web (hors périmètre MVP)
3. Ce n'est pas une source de pièces — c'est un moteur de recherche

**Décision :** OpenSERP est **rejeté** comme source de pièces industrielles. Il ne sera **pas** intégré à `ALL_CONNECTORS`.

---

## Bloc B — Requalification de `D-openserp-instance`

**Avant (E5-S03) :** `D-openserp-instance` — Moyenne, bloquée Docker OU Go.
**Après (E5-S04) :** `D-openserp-instance` — **requalifiée** : OpenSERP est **inadapté au périmètre** (moteur SERP web, pas catalogue de pièces).

**Nouvelle dette :** `D-openserp-inadapte` (Faible, documentaire) — OpenSERP retenu par erreur en E3-S01 comme source de pièces ; c'est un moteur SERP web. À retirer de la liste des sources E3. Docker provisionné (utile pour d'autres usages).

**Clôture de `D-openserp-instance` :** la dette est **résolue par requalification** — le blocage Docker est levé (Docker provisionné), mais la dette devient caduque car OpenSERP n'est pas une source de pièces.

---

## Bloc C — Bilan E5-S04

### C.1 Déblocages

| Bloc | Objet | Statut | Raison |
|---|---|---|---|
| Docker | Provisionnement | ✅ **Résolu** | Coordinateur a provisionné Docker |
| OpenSERP | SourceConnector pièces | 🔴 **Rejeté** | OpenSERP = moteur SERP web, pas catalogue de pièces |

### C.2 Livrable produit

- **Rapport de blocage documentaire** (même classe que E5-S03)
- **Requalification `D-openserp-instance`** → `D-openserp-inadapte` (Faible)
- **Docker provisionné** (utile pour d'autres usages futurs)

### C.3 Baseline E5-S04

| Métrique | Avant (E5-S05) | Après (E5-S04) | Statut |
|---|---|---|---|
| ESLint | 0/0 | 0/0 | ✅ tenue |
| TypeScript | 0 err | 0 err | ✅ tenue |
| Prettier | 0 | 0 | ✅ tenue |
| Build | 57 routes | 57 routes | ✅ tenue |
| E2E | 243/2/4 | 243/2/4 | ✅ tenue |
| Prisma | 14 migrations | 14 migrations | ✅ tenue |
| Dettes Moyennes | 5 | **4** (`D-openserp-instance` requalifiée Faible) | -1 Moyenne |

**E5-S04 ne modifie aucun code** (session documentaire — aucun connecteur OpenSERP créé).

---

## Décisions verrouillées (D-E5-S04-1 à D-E5-S04-4)

| ID | Décision | Justification |
|---|---|---|
| **D-E5-S04-1** | OpenSERP **rejeté** comme source de pièces | Moteur SERP web (Google/Bing/...), pas catalogue de pièces — mapping `SearchCandidate` impossible |
| **D-E5-S04-2** | Aucun connecteur OpenSERP créé | Pas de `openserpConnector`, pas d'intégration `ALL_CONNECTORS` |
| **D-E5-S04-3** | `D-openserp-instance` requalifiée → `D-openserp-inadapte` (Faible) | Blocage Docker levé, mais dette caduque (inadapté au périmètre) |
| **D-E5-S04-4** | Docker provisionné = actif pour usages futurs | Docker utile (E3-S03-bis alternatives, T3 DB down, environnements isolés) |

---

## Bloc D — Enseignements (R.5.1 renforcée)

### D.1 Leçon fondamentale

**Une dépendance provisionnée ne débloque pas une session si le périmètre est inadapté.** Docker était le blocage apparent, mais le blocage réel était **l'inadéquation d'OpenSERP au périmètre** (moteur web ≠ catalogue de pièces).

### D.2 R.5.1 renforcée (proposée R.5.16)

**R.5.16 — Vérification de nature avant intégration :** avant d'intégrer une source externe comme `SourceConnector`, **démarrer l'instance et capturer une réponse réelle** (Bloc 0) pour vérifier que le format correspond au modèle `SearchCandidate`. Une source bloquée par dépendance peut masquer une inadéquation fondamentale.

### D.3 Impact sur E3

E3-S01 a retenu 3 sources (TraceParts, CADENAS, OpenSERP). Bilan réel :
- **TraceParts** : catalogue de pièces ✅ (mode mock, réel prêt)
- **CADENAS** : abandonné (CGU restrictives, D-E3-19)
- **OpenSERP** : **inadapté** (moteur SERP web, pas catalogue) ❌
- **Wikidata** : ajouté en E3-S03 comme source externe réelle ✅

**Correction E3 :** la liste des sources E3 devrait être **TraceParts + Wikidata** (2 sources), pas TraceParts + CADENAS + OpenSERP.

---

## Passation E5-S04 → E5-S06

**E5-S04 est clôturée** (par requalification, pas par intégration). 

**Prochaine session :** E5-S06 (nettoyage dettes Faibles) — autonome, aucune dépendance externe.

**Priorités Coordinateur inchangées :**
- `HF_API_TOKEN` → `D-photo-embedding-backfill`
- `TRACEPARTS_*` → `D-traceparts-credentials`
- Vercel/Sentry/domaine → `D-deploy-comptes`

**Note :** Docker provisionné est un **actif** pour les sessions futures (environnements isolés, T3 DB down, alternatives à OpenSERP si un vrai catalogue Dockerisé est identifié).

---

**FIN DU RAPPORT E5-S04 — OpenSERP rejeté (moteur SERP web, pas catalogue de pièces). `D-openserp-instance` requalifiée Faible.**

**Note méta :** la découverte est **majoure** — elle corrige une erreur de cadrage héritée de E3-S01. Docker provisionné n'a pas débloqué OpenSERP comme source de pièces, car OpenSERP n'en est pas une. La leçon (R.5.16) : vérifier la nature d'une source **avant** de la retenir, en capturant une réponse réelle. E5 continue avec E5-S06 (nettoyage, autonome).
