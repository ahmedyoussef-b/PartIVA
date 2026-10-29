# RAPPORT-ETAT-DES-LIEUX-E73 — Sauvegarde et Historique du Workspace

**Date :** 2026-10-29  
**Objectif :** Etat des lieux ciblé avant proposition d'implantation E73.  
**Contrainte respectée :** Aucun code modifié, aucune implantation proposée.

---

## §1 Audit de `WorkspaceClient.tsx`

### Fichier
`src/components/workspace/WorkspaceClient.tsx` (112 lignes), `'use client'`.

### État actuel (React state uniquement, aucune persistance)
| État | Type | Valeur initiale | Rôle |
|---|---|---|---|
| `photos` | `string[]` | `[]` | URLs des photos uploadées |
| `cadFiles` | `string[]` | `[]` | URLs des fichiers CAO uploadés |
| `dimensions` | `{ length?, width?, height?, diameter?, unit }` | `{ unit: 'mm' }` | Dimensions saisies manuellement |
| `description` | `string` | `''` | Description texte de la pièce |
| `mode` | `'quick' | 'deep'` | `'quick'` | Mode d'analyse du moteur |
| `extractedDimensions` | `{ length, width, height, diameter } \| null` | `null` | Dimensions extraites par le viewer 3D |
| `result` | `EngineResult \| null` | `null` | Résultat complet de `runEngine` (`/api/engine`) |
| `status` | `'idle' \| 'loading' \| 'success' \| 'error'` | `'idle'` | Statut de la soumission |
| `error` | `string \| null` | `null` | Message d'erreur |

### Logique de sauvegarde existante
**Aucune.** Il n'existe aucun usage de `localStorage`, `sessionStorage`, ni d'appel API de sauvegarde/chargement. L'état est purement volatil (perdu au rechargement de la page ou à la navigation).

### Flux de soumission
`handleSubmit()` POST sur `/api/engine` avec `{ photos, cadFiles, dimensions, description, mode }`, stocke `data` dans `result`. Aucun identifiant de session n'est généré ni réutilisé.

### Point de contact avec `/api/engine`
`src/app/api/engine/route.ts` (POST uniquement) : exécute `runEngine(input, { mode })` et renvoie `{ success: true, ...result }`. Aucun paramètre d'identification de session n'est transmis.

---

## §2 Audit du schéma Prisma

### Fichier
`prisma/schema.prisma` (550 lignes).

### Modèles existants pertinents
- `User` (lignes 10-29) : `id`, `email`, `role` (UserRole: ADMIN / USER / VIEWER), `sessions` (auth sessions), `requests`, `parts`, `projects`, `auditLogs`, `partVersions`.
- `Request` (lignes 329-349) : `clientId`, `partDescription`, `photos` (Json?), `status`, `createdAt`, `updatedAt`. C'est le modèle le plus proche d'une "demande de pièce", mais il ne stocke pas le résultat complet du moteur (candidats, mesures, dimensions extraites).
- `ReverseEngineeringProject` (lignes 194-213) : `name`, `description`, `status`, `partId`, `userId`, `cadFiles`. Projet de rétro-ingénierie lié à une pièce.
- `AuditLog` (lignes 295-310) : `userId`, `action`, `entityType`, `entityId`, `metadata` (Json?), `createdAt`. Log générique d'actions.
- `PartVersion` (lignes 312-327) : `partId`, `versionNumber`, `snapshot` (Json). Versionning d'une pièce existante.

### Modèle de session de workspace : ABSENT
Il n'existe aucun modèle `WorkspaceSession`, `SearchHistory`, `WorkspaceHistory` ou équivalent. Aucun champ sur `User` ou `Request` ne stocke un snapshot du état du workspace (photos, cadFiles, dimensions, résultat du moteur, mesures angle/diamètre).

### Structure minimale proposée (si option DB)
Un modèle `WorkspaceSession` pourrait contenir :
- `id` (@id @default(cuid()))
- `userId` (@relation User)
- `name` (String?)
- `photos` (Json? ou String[] sérialisé)
- `cadFiles` (Json?)
- `dimensions` (Json?)
- `description` (String?)
- `mode` (String)
- `result` (Json?) — snapshot complet de EngineResult
- `status` (String)
- `createdAt`, `updatedAt`

---

## §3 Audit des routes API existantes

### Fichiers sous `src/app/api/` (57 routes)

Routes principales :
- `/api/engine` (POST) — exécution du moteur IA, retourne `EngineResult`. Aucun identifiant de session.
- `/api/parts` (GET, POST) — liste/création de pièces (ADMIN pour POST).
- `/api/requests` (GET, POST) — liste/création de demandes clients.
- `/api/parts/[id]` (GET, PUT, DELETE) — détail/modification/suppression d'une pièce.
- `/api/ai/chat` (POST) — chat IA avec contexte.
- `/api/search`, `/api/search/photo`, `/api/search/vehicle`, `/api/search/vin` — recherche.
- `/api/audit` — logs d'audit.
- `/api/dashboard`, `/api/dashboard/kpi` — métriques.
- `/api/sync`, `/api/desktop/sync/*` — synchronisation client desktop.
- `/api/upload`, `/api/upload-url` — upload fichiers.

### Route de sauvegarde/chargement de session de workspace : ABSENTE
Aucune route `/api/workspace/session`, `/api/workspace/history` ou équivalent n'existe. Il n'existe aucun endpoint pour persister ou recharger l'état du workspace (photos, cadFiles, dimensions, résultat, mesures).

### Patterns d'authentification dans les routes
- `/api/parts/route.ts` : utilise `requireAdmin()` pour POST, session pour GET (filtrage par clientId si USER).
- `/api/requests/route.ts` : pas de vérification d'authentification (POST accepte `clientId` depuis le body).
- `/api/engine/route.ts` : pas de vérification d'authentification.

---

## §4 Audit de l'authentification

### Côté client
`src/lib/auth-client.ts` : `useSession` depuis `better-auth/react`. Retourne `{ data: { user: { id, email, name, role?, image? } } }`. Le champ `role` est un `additionalFields` sur le modèle User (défaut 'USER').

### Côté serveur
`src/lib/auth-server.ts` : `getCurrentUser()` (retourne `session?.user ?? null`) et `requireUser()` (redirect `/login` si absent). `src/lib/auth-admin.ts` : `requireAdmin()` (lève 401/403 si pas ADMIN).

### Modèle User et rôle
`prisma/schema.prisma:14` : `role UserRole @default(USER)` avec enum `UserRole { ADMIN, USER, VIEWER }`.

### Accès au workspace
`WorkspaceClient` n'a aucune garde d'authentification : le composant est rendu sans vérification de session. L'authentification n'est vérifiée que dans certaines routes API (ex: `/api/parts` POST). Le workspace est donc accessible à tout utilisateur (connecté ou non), côté client.

---

## §5 Cartographie des options d'implémentation

### Option A — Sauvegarde en base de données (modèle `WorkspaceSession` + routes API)

- **Faisabilité :** Élevée. Prisma est déjà configuré (PostgreSQL). Un nouveau modèle `WorkspaceSession` avec relation `User` et deux routes API (`POST /api/workspace/session` pour sauvegarder, `GET /api/workspace/session` ou `[id]` pour recharger) suffiraient.
- **Risque :** Moyen. Nécessite une migration Prisma (`prisma migrate dev`), création de routes API server-side, gestion de l'authentification (quel utilisateur peut sauver/charger quelle session), et nettoyage potentiel des anciennes sessions.
- **Impact sur les flux stables :** Faible à moyen. `WorkspaceClient` doit être modifié pour appeler les API de save/load, mais les appels existants à `/api/engine` ne changent pas. Risque de régression limité car c'est du code additif.
- **Avantages :** Persistance durable, accessible depuis n'importe quel appareil, historique consultable, auditable via `AuditLog`.

### Option B — Sauvegarde locale (localStorage)

- **Faisabilité :** Très élevée. Aucun changement de schéma, aucune route API, aucune migration. Ajout de `useEffect` dans `WorkspaceClient` pour persister/restaurer l'état dans `localStorage`.
- **Risque :** Faible. Code isolé côté client, pas de impact sur le serveur ni la base de données.
- **Impact sur les flux stables :** Très faible. `WorkspaceClient` est le seul composant modifié. Pas de régression possible sur les routes API existantes.
- **Inconvénients :** Données limitées au navigateur/appareil, pas d'historique partagé, pas d'audit, limite de taille (~5 Mo), données perdues en cas de vidage du cache/navigateur.

### Option C — Sauvegarde hybride (localStorage pour l'instantané, DB pour l'historique)

- **Faisabilité :** Moyenne. Combine les complexités de A et B : logique de sauvegarde double, synchronisation entre localStorage et DB, gestion de conflit (quelle source de vérité ?).
- **Risque :** Moyen-élevé. Plus de surface de code, logique de synchronisation à maintenir, risque d'incohérence entre les deux stockages.
- **Impact sur les flux stables :** Moyen. Modification de `WorkspaceClient` + création de routes API + modèle DB.

### Synthèse comparative

| Critère | Option A (DB) | Option B (localStorage) | Option C (hybride) |
|---|---|---|---|
| Fichiers modifiés | `WorkspaceClient.tsx` + nouveau modèle + routes API | `WorkspaceClient.tsx` uniquement | `WorkspaceClient.tsx` + modèle + routes API |
| Migration Prisma | Oui | Non | Oui |
| Routes API nouvelles | Oui (save/load) | Non | Oui (historique uniquement) |
| Persistance multi-appareil | Oui | Non | Oui (historique) |
| Risque de régression | Faible | Très faible | Moyen |
| Complexité | Moyenne | Très faible | Élevée |

---

## §6 Modules isolés et points de contact

### Modules isolés (modifiables sans régression)
- `src/components/workspace/WorkspaceClient.tsx` : orchestre l'état et les sous-composants. Aucune dépendance externe hors React et l'appel `/api/engine`.
- `src/components/workspace/IngestZone.tsx` : formulaire de collecte (fichiers, dimensions, description). État reçu par props, aucun effet de bord serveur.
- `src/components/workspace/AssistantZone.tsx` : affichage des résultats et candidats. État reçu par props.
- `src/components/workspace/ViewerZone.tsx` : affichage 3D et outils de mesure. État reçu par props.

### Points de contact avec `/api/engine`
- `WorkspaceClient.handleSubmit()` (ligne 51-79) : POST `/api/engine`, stocke le résultat dans `result`.
- Aucune authentification n'est requise sur `/api/engine` actuellement.
- Aucun identifiant de session n'est transmis ni retourné par `/api/engine`.

### Points de contact avec l'authentification
- `WorkspaceClient` n'utilise pas `useSession`. L'utilisateur courant n'est pas connu côté client dans ce composant.
- Côté serveur, `getCurrentUser()` / `requireUser()` / `requireAdmin()` sont disponibles via `src/lib/auth-server.ts` et `src/lib/auth-admin.ts`.

---

## §7 Conclusion de l'état des lieux

- `WorkspaceClient` gère un état React complet (photos, cadFiles, dimensions, description, mode, résultat, statut, erreur) mais **aucune persistance** n'existe (ni localStorage, ni base de données).
- Le schéma Prisma ne contient **aucun modèle de session/historique de workspace**. Le modèle `Request` s'en rapproche mais ne stocke pas le snapshot complet du moteur.
- Aucune route API ne permet de sauvegarder ou recharger une session de workspace.
- L'authentification est disponible (`useSession` côté client, `getCurrentUser`/`requireUser`/`requireAdmin` côté serveur) mais le workspace n'en fait pas usage actuellement.
- Quatre modules sont isolés (`WorkspaceClient`, `IngestZone`, `AssistantZone`, `ViewerZone`) et modifiables sans régression sur les routes API existantes.
- Trois options d'implémentation sont cartographiées (A : DB, B : localStorage, C : hybride) avec faisabilité, risque et impact.

### Arrêt
Conformément à la consigne, aucune implantation n'est proposée et aucun code n'a été modifié. Le superviseur dispose désormais des éléments pour choisir et proposer l'implantation E73 (Option B recommandée pour une première itération rapide et sans risque) en toute connaissance de cause.
