# SESSION 2026-10-22 — E27 — Diagnostic profond du bug E2E persistant

**Émetteur :** IA externe (Superviseur)
**Auteur :** IA interne (Kilo Code)
**Date :** 2026-10-22
**Statut :** Diagnostic terminé — cause racine établie avec preuve
**Phase :** Diagnostic uniquement. **Aucune modification de code produit.** Aucun patch, aucune relance CI.

---

## 0. Réponse courte à la question du coordinateur

> *« pourquoi `POST /api/auth/sign-in/email` renvoie `400` en CI alors que le seed et le build passent ? »*

**La prémisse du `400` est fausse.** L'endpoint ne renvoie **jamais** de `400` dans ce scénario. Les statuts réellement observés sont :

| Statut | Signification | Preuve |
|---|---|---|
| `200` | identifiants valides | `ci-run-utf8.log` (tests non listés) + sonde locale |
| `401` + `{"code":"INVALID_EMAIL_OR_PASSWORD"}` | utilisateur inexistant **ou** mot de passe faux | `ci-run-utf8.log` L1849, L1868, L2112 ; sonde locale §3.2 |
| `429` | rate limit Better Auth dépassé | `ci-run-utf8.log` L1887, L1906, L1944, L2039, L2057, L2093 |
| `403` + `MISSING_OR_NULL_ORIGIN` | requete sans en-tête `Origin` (non applicable à Playwright) | sonde locale §3.2, cas D |

Les `400` visibles dans les logs CI sont les **noms de tests** (`"... returns 400"`), pas des statuts de sign-in. Exemple : `e2e/api.spec.ts:124:5 › api: /api/parts POST with invalid payload returns 400` → le test attend 200 sur le **sign-in**, et reçoit 429.

La vraie cause racine est une **incohérence de variables d'environnement entre l'étape `prisma db seed` et l'étape `playwright test`** : en CI le seed bascule sur sa branche « mock/dev » et crée les comptes `*@partiva.dev`, alors que la suite E2E demande les comptes `E2E_ADMIN_*` / `E2E_USER_*` / `E2E_VIEWER_*`, qui n'existent pas.

**Il y a en réalité 3 causes bloquantes indépendantes** (détails §3). Les corriger toutes trois est nécessaire ; corriger une seule ne suffira pas.

---

## 1. Fichiers reçus

### 1.1 Configuration Playwright et E2E

| Fichier | État | Contenu |
|---|---|---|
| `playwright.config.ts` | **complet** | 75 lignes, lu intégralement |
| `e2e/setup/auth.setup.ts` | **complet** | 44 lignes (working tree) + version `@e8071ec` + version `@59fdba2` |
| `e2e/setup/warmup.setup.ts` | **complet** | 43 lignes |
| `e2e/setup/ids.setup.ts` | **complet** | 23 lignes |
| `e2e/helpers/*.ts` | **INTROUVABLE** | le dossier `e2e/helpers/` n'existe pas. Signalé, non improvisé. |
| `e2e/fixtures/users.ts` | **complet** | 47 lignes |
| `e2e/fixtures/access-matrix.ts` | **complet** | 94 lignes |
| `e2e/fixtures/dynamic-ids.ts` | **complet** | 26 lignes |
| `e2e/fixtures/dynamic-ids-fixture.ts` | **complet** | 11 lignes |
| `e2e/fixtures/submitted-part.ts` | **complet** | 47 lignes |
| `e2e/global-setup.ts` | **INTROUVABLE** | n'existe pas (remplacé par le projet `warmup`) |
| `e2e/global-teardown.ts` | **INTROUVABLE** | n'existe pas |

### 1.2 Configuration Better Auth

| Fichier | État |
|---|---|
| `src/lib/auth.ts` | **complet** (40 lignes) |
| `src/lib/auth-client.ts` | **complet** (10 lignes) |
| `src/lib/auth-server.ts` | **complet** (18 lignes) |
| `src/lib/auth-admin.ts` | **complet** (19 lignes) |
| `src/app/api/auth/[...all]/route.ts` | **complet** (4 lignes) |

### 1.3 Seed et base de données

| Fichier | État |
|---|---|
| `prisma/seed.ts` | **complet** (1172 lignes) — working tree, **HEAD `b99b634`**, **`e8071ec`**, **`59fdba2`** (le commit du run CI) |
| `prisma/schema.prisma` | **complet** (519 lignes) — modèles `User`/`Session`/`Account` reproduits ci-dessous ; 23 modèles au total |
| `prisma.config.ts` / `prisma7.config.ts` | **complet** (16 lignes chacun) |
| `package.json` | **complet** (84 lignes) |

**Attention — point demandé explicitement :** `package.json` **ne contient aucune clé `prisma.seed`**. La ligne exacte du script de seed est :

```json
"db:seed": "tsx prisma/seed.ts"
```

et le seed est branché par `prisma.config.ts` (et `prisma7.config.ts`) :

```ts
migrations: {
  path: 'prisma/migrations',
  seed: 'tsx ./prisma/seed.ts',
},
```

> Conséquence vérifiée : le log CI affiche `Loaded Prisma config from prisma7.config.ts.` → **Prisma 7.10 charge `prisma7.config.ts`, pas `prisma.config.ts`**. Les deux fichiers sont identiques, donc sans impact, mais c'est une ambiguïté à lever.

### 1.4 Workflow CI

| Fichier | État |
|---|---|
| `.github/workflows/ci.yml` | **complet** (97 lignes) — working tree, **HEAD `b99b634`**, **`59fdba2`** (commit du run analysé) |

### 1.5 Tests E2E

| Fichier | État |
|---|---|
| `e2e/auth-api.spec.ts` | **complet** (88 lignes) |
| `e2e/api.spec.ts` | **complet** (245 lignes) |
| `e2e/smoke.spec.ts` | **complet** (59 lignes) |
| `e2e/search.spec.ts` | 60 premières lignes sur 676 + `authRequest` local (L5-15) — conforme à la demande |

### 1.6 Logs et preuves

| Fichier | État |
|---|---|
| `ci-run-utf8.log` | **complet** — log du job E2E du run GitHub Actions `39742458817`, **commit `59fdba28a11a56794b88970a823cb2e2a3308eae`** |
| `ci-run.log` | lu (en-tête + recherche SHA) — même run |
| `e2e-status.log` | **complet** (18 lignes) |
| `docs/sessions/rapports/README-CI-DIAGNOSTIC.md` | **complet** (44 lignes) — diagnostic antérieur (cause npm 401), **hors périmètre** de la présente analyse |

### 1.7 Versions et environnement

```
node -v              → v22.23.2
npm -v               → 10.9.8
better-auth          → 1.7.7
@playwright/test     → 1.64.0
prisma               → 7.10.0
@prisma/client       → 7.10.0
```

```
b99b634 2026-10-22 09:48:41 +0100  Fix E2E auth: pass E2E_USER_PASSWORD and E2E_VIEWER_PASSWORD to seed step   ← HEAD
e8071ec 2026-10-22 09:23:46 +0100  Fix E2E auth: use E2E_*_PASSWORD for seed accounts, fail loudly on setup login errors
59fdba2 2026-10-22 08:43:08 +0100  fix: ajouter DATABASE_URL/DIRECT_URL/BETTER_AUTH_SECRET au job e2e            ← commit DU run CI analysé
d8c7de7 2026-10-22 08:38:30 +0100  fix: configurer E2E CI with Better Auth secrets and production webserver
```

---

## 2. Réponses aux 7 questions (§2 du prompt)

### 2.1 Le setup Playwright s'exécute-t-il vraiment ?

**Réponse :** Oui, il s'exécute — mais **après** les projets `chromium` et `public`, qui ne déclarent aucune dépendance à `setup`. Il ne conditionne donc pas les specs qui échouent en premier.

**Preuve** — `playwright.config.ts:19-66` :

```ts
projects: [
  { name: 'warmup',    testMatch: /warmup\.setup\.ts/ },
  { name: 'setup',     testMatch: /auth\.setup\.ts/, dependencies: ['warmup'] },
  { name: 'ids-setup', testMatch: /ids\.setup\.ts/,  dependencies: ['warmup'] },
  { name: 'chromium',  testIgnore: [/fixtures\//, /setup\//, /public\//, /admin\//, /user\//, /viewer\//], retries: 0 },
  { name: 'public',    testDir: './e2e/public', use: { ...devices['Desktop Chrome'] }, retries: 1 },
  { name: 'admin',     testDir: './e2e/admin',  storageState: '.auth/admin.json',  dependencies: ['setup', 'ids-setup'] },
  { name: 'user',      testDir: './e2e/user',   storageState: '.auth/user.json',   dependencies: ['setup', 'ids-setup'] },
  { name: 'viewer',    testDir: './e2e/viewer', storageState: '.auth/viewer.json', dependencies: ['setup', 'ids-setup'] },
],
```

`chromium` (L35-38) et `public` (L40-44) n'ont **ni `dependencies: ['setup']` ni `storageState`** — contrairement à l'attente formulée dans §2.1.

**Preuve d'ordonnancement** — `ci-run-utf8.log` :

```
L1532:  ✔  1 [warmup] › e2e/setup/warmup.setup.ts:31:7 › warm up dev server routes (5.9s)
L1811:  ✘ 263 [setup] › e2e/setup/auth.setup.ts:12:8 › authenticate as ADMIN (30.0s)
L1812:  ✔ 264 [setup] › e2e/setup/auth.setup.ts:12:8 › authenticate as USER (2.8s)
L1813:  ✔ 265 [setup] › e2e/setup/auth.setup.ts:12:8 › authenticate as VIEWER (1.7s)
L1814:  ✔ 266 [ids-setup] › e2e/setup/ids.setup.ts:4:6 › extract dynamic request ids from API (789ms)
```

Le setup est donc le **test n° 263 sur 266** : tout le projet `chromium` (qui contient `api.spec.ts`, `smoke.spec.ts`, `search.spec.ts`, `auth-api.spec.ts`) s'est exécuté **avant** lui. Et comme `setup` a échoué, les projets `admin`/`user`/`viewer` ont été sautés → `81 did not run` (L3912).

**Niveau de certitude : certain.**

---

### 2.2 Que renvoie exactement `POST /api/auth/sign-in/email` ?

**Réponse :** `401` + `{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}` quand l'utilisateur n'existe pas ou le mot de passe est faux ; `429` ensuite, par cascade de rate limit. **Jamais `400`.**

**Preuve A — source Better Auth 1.7.7** (`node_modules/better-auth/dist/api/routes/sign-in.mjs`) :

```js
ctx.context.logger.warn("User not found");
throw APIError.from("UNAUTHORIZED", BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD);
```

`UNAUTHORIZED` = **401**.

**Preuve B — sonde locale exécutée** (serveur `next dev`, `BETTER_AUTH_URL=http://localhost:3000`, sur la base Neon partagée) :

```
--- CASE A — CI-equivalent ADMIN credentials (utilisateur inexistant) ---
  email used      : ahmedyoussefabbes@gmail.com
  STATUS: 401
  BODY: {"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}

--- CASE B — seeded mock admin (admin@partiva.dev / PartIVA-dev-2026!) ---
  STATUS: 200
  BODY: {"redirect":false,"token":"…","user":{"name":"Marc Dubois","email":"admin@partiva.dev",…,"role":"ADMIN",…}}

--- CASE C — seeded mock admin, mauvais mot de passe ---
  STATUS: 401
  BODY: {"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
```

**Preuve C — log CI** (`ci-run-utf8.log`) :

```
L1846: Error: expect(received).toBe(expected) // Object.is equality
L1848: Expected: 200
L1849: Received: 401
      at authRequest (/home/runner/work/PartIVA/PartIVA/e2e/api.spec.ts:12:29)

L1886: Expected: 200
L1887: Received: 429

L2038: Expected: 200
L2039: Received: 429
```

**Preuve D — log serveur Better Auth** (`ci-run-utf8.log` L1810) :

```
[WebServer] 2026-10-22T08:53:48.911Z WARN [Better Auth]: User not found
```

**Niveau de certitude : certain.**

---

### 2.3 Le mot de passe en base est-il vérifiable par Better Auth ?

**Réponse :** Oui, parfaitement. L'algorithme, le sel et le format sont corrects. **Ce n'est pas la cause.**

**Preuve A — le seed utilise l'API officielle Better Auth** (`prisma/seed.ts:4`, `:73`, `:220`) :

```ts
import { hashPassword } from 'better-auth/crypto';
…
const adminPasswordHash = await hashPassword(adminPassword);
…
const devPasswordHash = await hashPassword('PartIVA-dev-2026!');
```

**Preuve B — format de hachage conforme** (sonde locale) :

```
fresh hash = 731d7276416cd3e5c4e01a212a145a81:2704d281…59184
parts = 2 | salt len = 32          ← scrypt : sel hexadécimal 32 car. : hash
stored salt = 38ef092de119fee0fd42ea1c40a92f8d | stored hash len = 161
```

**Preuve C — vérification effective contre les 4 comptes de la base partagée** :

```
admin@partiva.dev      verify('PartIVA-dev-2026!')=true  verify(.env ADMIN_PASSWORD)=false
user@partiva.dev       verify('PartIVA-dev-2026!')=true  verify(.env ADMIN_PASSWORD)=false
viewer@partiva.dev     verify('PartIVA-dev-2026!')=true  verify(.env ADMIN_PASSWORD)=false
client2@partiva.dev    verify('PartIVA-dev-2026!')=true  verify(.env ADMIN_PASSWORD)=false
```

Les 4 comptes ont le **même sel** → un seul `hashPassword('PartIVA-dev-2026!')` réutilisé 4 fois → c'est exactement le code de la **branche mock** du seed (`prisma/seed.ts:220`).

**Preuve D — conséquence decisive :** le hash **stocké en base est bien celui du mock**, pas celui de `E2E_ADMIN_PASSWORD`. L'algorithme est donc irréprochable ; c'est le *choix du compte* et du *mot de passe* qui est faux.

**Niveau de certitude : certain.**

---

### 2.4 Les variables d'environnement sont-elles cohérentes entre seed et setup ?

**Réponse :** **NON.** C'est la cause racine principale. En CI, l'étape `prisma db seed` ne reçoit **pas** `ADMIN_EMAIL`, alors que `prisma/seed.ts` (au commit du run) teste `if (adminEmail && adminPassword)`. La condition est donc fausse → branche mock.

**Preuve A — seed, commit `59fdba2` (celui du run analysé)** :

```ts
// prisma/seed.ts:50-51  (@59fdba2)
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
…
// prisma/seed.ts:59
if (adminEmail && adminPassword) { … } else { /* mock/dev */ }
```

**Preuve B — variables d'environnement RÉELLEMENT passées à l'étape seed en CI** (`ci-run-utf8.log` L1327-1333) :

```
env:
NODE_VERSION: 22
DATABASE_URL: ***
DIRECT_URL: ***
BETTER_AUTH_SECRET: ***
ADMIN_PASSWORD: ***
```

→ **`ADMIN_EMAIL` est ABSENT.** `ADMIN_PASSWORD` est présent mais seul → `adminEmail` vaut `undefined` → condition fausse.

**Preuve C — le seed le confirme lui-même** (`ci-run-utf8.log` L1339) :

```
⚠️  ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock (dev uniquement)
```

**Preuve D — le compte réellement créé** (L1363) :

```
users: 4
```

soit `admin@partiva.dev`, `user@partiva.dev`, `viewer@partiva.dev`, `client2@partiva.dev` — **et non** les comptes `E2E_*` demandés par la suite.

**Preuve E — variables de l'étape `test:e2e`** (`ci-run-utf8.log` L1388-1399) :

```
env:
NODE_VERSION: 22
DATABASE_URL: ***
DIRECT_URL: ***
BETTER_AUTH_SECRET: ***
BETTER_AUTH_URL: http://localhost:3000
E2E_ADMIN_EMAIL: ***
E2E_ADMIN_PASSWORD: ***
E2E_USER_EMAIL: ***
E2E_USER_PASSWORD: ***
E2E_VIEWER_EMAIL: ***
E2E_VIEWER_PASSWORD: ***
```

**Preuve F — résolution côté test** (`e2e/fixtures/users.ts:24-26`) :

```ts
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@partiva.dev';
const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD;
```

**Preuve G — résolution côté seed, à la même époque** (`prisma/seed.ts` @ `59fdba2`) : `process.env.ADMIN_EMAIL` **uniquement**.

→ **Deux résolutions de variables différentes pour le même compte, dans deux étapes CI différentes, sans variable commune qui guarantee le lien.** `ADMIN_PASSWORD` est injecté dans le seed mais **jamais lu** par le seed (`ADMIN_EMAIL` manquant ⇒ branche mock ⇒ `ADMIN_PASSWORD` ignoré). Et dans l'étape `test:e2e`, `ADMIN_PASSWORD` n'est **pas** injecté du tout ⇒ `users.ts` retombe sur `E2E_ADMIN_PASSWORD` / `E2E_USER_PASSWORD` / `E2E_VIEWER_PASSWORD`, qui ne sont **pas** les mots de passe seedés.

**Preuve H — tabel de correspondance (état au commit `59fdba2`) :**

| Rôle | Email attendu par la suite (source) | Email réellement seedé | Verdict |
|---|---|---|---|
| ADMIN | `E2E_ADMIN_EMAIL` (secret, `***`) | `admin@partiva.dev` | **INCONCISTANT** |
| USER | `E2E_USER_EMAIL` (secret) | `user@partiva.dev` | **INCONCISTANT** |
| VIEWER | `E2E_VIEWER_EMAIL` (secret) | `viewer@partiva.dev` | **INCONCISTANT** |
| client2 | `E2E_CLIENT2_EMAIL` (non lu par `users.ts` ni seedé) | `client2@partiva.dev` | **INCONCISTANT** |

> Nuance expliquant les setups USER/VIEWER **verts** en CI (L1812-1813) alors qu'ADMIN est **rouge** : les secrets `E2E_USER_EMAIL`/`E2E_VIEWER_EMAIL`/`E2E_*_PASSWORD` correspondent (par valeur) aux comptes mock `user@partiva.dev` / `viewer@partiva.dev` et au mot de passe `PartIVA-dev-2026!`, alors que `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` désignent un **compte dédié qui n'a jamais été créé**. D'où le `WARN [Better Auth]: User not found` puis l'échec du setup ADMIN, et les `401` puis `429` sur les `authRequest` ADMIN.

**Niveau de certitude : certain.**

---

### 2.5 La limite de taux de Better Auth est-elle atteinte ?

**Réponse :** **OUI — et c'est une cause bloquante indépendante de la précédente.** Même avec des identifiants corrects, la suite ne peut pas passer : elle émet ~104 requêtes `POST /api/auth/sign-in/email` alors que la limite est de **3 par fenêtre de 10 s**, et le quota est consommé **avant** le handler, donc **aussi sur un sign-in réussi**.

**Preuve A — règle par défaut Better Auth 1.7.7** (`node_modules/better-auth/dist/api/rate-limiter/index.mjs:305-312`) :

```js
function getDefaultSpecialRules() {
	return [{
		pathMatcher(path) {
			return path.startsWith("/sign-in") || path.startsWith("/sign-up") || …;
		},
		window: 10,
		max: 3
	}, …];
}
```

**Preuve B — activation en production uniquement** (`dist/api/index.mjs`) :

```js
rateLimit: {
	…options.rateLimit,
	enabled: options.rateLimit?.enabled ?? isProduction,
	window: options.rateLimit?.window || 10,
	max: options.rateLimit?.max || 100,
	…
}
```

**Preuve C — consommation en phase requête, avant le handler** (`dist/api/index.mjs` + `dist/api/rate-limiter/index.mjs:292-303`) :

```js
const rateLimitResponse = await onRequestRateLimit(currentRequest, ctx);
if (rateLimitResponse) return rateLimitResponse;
```

```js
async function onRequestRateLimit(req, ctx) {
	if (!ctx.rateLimit.enabled) return;
	…
	const { allowed, retryAfter } = await storage.consume(key, rule);
	if (!allowed) return rateLimitResponse(retryAfter ?? currentWindow);
}
```

Le `consume()` est inconditionnel : un sign-in **réussi** consomme aussi le quota.

**Preuve D — la clé est (IP + path)** (`index.mjs:248`) : `createRateLimitKey(ip ?? NO_TRUSTED_IP_KEY, path)`. En CI, toutes les requêtes viennent de `127.0.0.1` → **un seul bucket**.

**Preuve E — comptage des sign-ins dans la suite** (grep sur `e2e/**`) :

- **96** invocations de `authRequest(request, …)` → 96 POST `sign-in/email` ;
- **~23** appels `request.post('/api/auth/sign-in/email', …)` directs supplémentaires (fichiers : `auth-api.spec.ts` ×3, `part-transitions.spec.ts` ×3, `part-versions.spec.ts` ×2, `part-specifications.spec.ts` ×2, `part-images.spec.ts` ×2, `part-attachments.spec.ts` ×2, `part-version-diff.spec.ts` ×2, `part-dossier.spec.ts`, `part-completeness.spec.ts`, `fit-reports.spec.ts`, `cloudinary-upload.spec.ts`, `api.spec.ts`, `search.spec.ts`, `smoke.spec.ts`) ;
- **+3** sign-ins navigateur du projet `setup` ;
- **total ≈ 104**.

**Preuve F — workers** (`playwright.config.ts:13`) : `workers: 1`. Le parallélisme n'est donc **pas** en cause : c'est le **volume total** qui dépasse le plafond.

**Preuve G — arithmétique de la cascade (conforme au log CI) :**

| Fenêtre | Requêtes autorisées | Observé |
|---|---|---|
| 1 | 3 | `401` (L1849), `401` (L1868) → 3e → `429` (L1887) |
| 2+ | 0 jusqu'à expiration | `429` en cascade : L1906, L1944, L1982, L2001, L2020, L2039, L2057, L2093, L2112(401), L2131(401)… |

Le passage `401 → 401 → 429 → 429…` est la signature exacte d'un bucket (3/10 s) saturé.

**Preuve H — plafond théorique du run :** le run CI dure `159 passed (2.5m)` ≈ 150 s. Avec 3 requêtes / 10 s, le maximum théorique sur 150 s est ≈ **45 sign-ins**. La suite en émet ≈ **104**. **La suite ne peut structurellement pas passer en production** sans lever la limite.

**Note importante :** `customRules` de Better Auth (`index.mjs:262-278`) permet de désactiver la limite sur un chemin précis (`resolved === false` → `return null`). C'est le point d'accroche naturel du correctif.

**Niveau de certitude : certain.**

---

### 2.6 Y a-t-il une différence entre local et CI ?

**Réponse :** **Oui, deux différences-structurelles**, et le mode local masque le bug.

**Différence 1 — variables d'environnement :**

| | Local (`.env` / `.env.local`) | CI (étape `prisma db seed`) |
|---|---|---|
| `ADMIN_EMAIL` | **présent** (`ahmedyoussefabbes@gmail.com`) | **ABSENT** |
| `ADMIN_PASSWORD` | présent | présent |
| `E2E_*` | tous **ABSENTS** | présents |

Preuve (extrait `.env`, valeurs masquées) :

```
ADMIN_EMAIL        = ahmedyoussefabbes@gmail.com
ADMIN_PASSWORD     = <set, len=11>
BETTER_AUTH_URL    = https://part-iva.vercel.app
E2E_ADMIN_EMAIL    = <UNDEFINED>
E2E_USER_EMAIL     = <UNDEFINED>
E2E_VIEWER_EMAIL   = <UNDEFINED>
```

Effet : **localement** le seed prend la branche « admin réel » et crée `ahmedyoussefabbes@gmail.com` ; **en CI** il prend la branche mock. La suite E2E locale ne peut donc pas reproduire l'échec « tant que la base n'est pas dans l'état mock ».

**Différence 2 — état réel de la base Neon partagée.** La base **actuellement** en base (celle que le seed CI пиette) contient exactement les 4 comptes mock :

```
email | role | providerId | password_hash_prefix
admin@partiva.dev   | ADMIN  | credential | 38ef092de119fee0fd42ea1c40a92f8d:94ac7ee
client2@partiva.dev | USER   | credential | 38ef092de119fee0fd42ea1c40a92f8d:94ac7ee
user@partiva.dev    | USER   | credential | 38ef092de119fee0fd42ea1c40a92f8d:94ac7ee
viewer@partiva.dev  | VIEWER | credential | 38ef092de119fee0fd42ea1c40a92f8d:94ac7ee
sessions count = 4
```

→ **La base est actuellement dans l'état laissé par le seed mock de la CI.** C'est pourquoi la reproduction **locale** du run de setup échoue elle aussi (voir §3.3).

**Preuve — le setup local reproduit EXACTEMENT la signature CI** :

```
Running 3 tests using 1 worker
  x  1 [setup] › e2e\setup\auth.setup.ts:12:8 › authenticate as ADMIN (31.2s)
  x  2 [setup] › e2e\setup\auth.setup.ts:12:8 › authenticate as USER (30.1s)
  x  3 [setup] › e2e\setup\auth.setup.ts:12:8 › authenticate as VIEWER (33.4s)
  3 failed
```

Et côté serveur :

```
2026-10-22T09:59:55.031Z WARN [Better Auth]: User not found
 POST /api/auth/sign-in/email 401 in 8.9s
2026-10-22T10:00:10.629Z WARN [Better Auth]: Invalid password
 POST /api/auth/sign-in/email 401 in 449ms
2026-10-22T10:00:44.383Z WARN [Better Auth]: User not found
 POST /api/auth/sign-in/email 401 in 314ms
```

**Divergence restante à surveiller (non bloquante en CI) :** `BETTER_AUTH_URL` local = `https://part-iva.vercel.app` alors que CI = `http://localhost:3000`. Or `src/lib/auth.ts:24-26` en déduit `useSecureCookies` :

```ts
useSecureCookies:
  process.env.NODE_ENV === 'production' &&
  Boolean(process.env.BETTER_AUTH_URL?.startsWith('https://')),
```

→ en local `useSecureCookies = true` (cookie `__Secure-`), en CI `false`. Chromium accepte les cookies `Secure` sur `localhost`, donc ce n'est pas bloquant localement, mais c'est une divergence de configuration à uniformiser.

**Niveau de certitude : certain.**

---

### 2.7 Le serveur Next.js démarre-t-il correctement en CI ?

**Réponse :** **OUI.** Le serveur démarre, compile et sert correctement. Ce n'est pas un problème d'infrastructure. Le `webServer` Playwright fait bien `npm run build && npm run start`.

**Preuve A — configuration** (`playwright.config.ts:67-74`) :

```ts
webServer: {
  command: 'npm run build && npm run start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe',
  stderr: 'pipe',
  timeout: 180_000,
},
```

**Preuve B — démarrage effectif dans le log CI** (`ci-run-utf8.log` L1405-1420) :

```
[WebServer]
[WebServer] > atelier-pieces-industrielles@0.1.0 build
[WebServer] > prisma generate && next build
[WebServer] Next.js 16.4.0 (Turbopack)
[WebServer]   Creating an optimized production build ...
[WebServer] ✓ Compiled successfully in 869ms
[WebServer]   Running TypeScript ...
```

**Preuve C — le serveur répond** : 159 tests sont passés, dont des tests de pages et d'API sans authentification :

```
L1775: ✔ 228 [chromium] › e2e/vercel-validation.spec.ts:15:7 › Admin Dashboard — accessible (200 ou redirection /login) (1.3s)
L1781: ✔ 234 [chromium] › e2e/vercel-validation.spec.ts:29:5 › Healthcheck API (750ms)
L1806: ✔ 245 [public] › e2e/public/public-access.spec.ts:17:7 › unauthenticated → /comment-ca-marche is accessible (218ms)
```

**Preuve D — aucun `Error` serveur bloquant** : le seul avertissement Better Auth utile est celui du §2.4 ; le warning `Base URL is not set` (L1222) provient du **job `build`** (qui ne définit pas `BETTER_AUTH_URL`) et n'affecte pas le runtime du job `e2e` (qui le définit, L1393).

**Réserve — état actuel de l'arbre de travail :** le build est aujourd'hui **cassé** (voir §3.2). Mais au commit du run analysé (`59fdba2`), le build passait.

**Niveau de certitude : certain.**

---

## 3. Cause racine identifiée

### 3.1 Cause racine n°1 — divergence des variables entre l'étape `seed` et l'étape `test` (PRINCIPALE)

**Énoncé :**

> En CI, l'étape `npx prisma db seed` ne reçoit pas la variable `ADMIN_EMAIL`. Or `prisma/seed.ts` (commit `59fdba2`) conditionne la création des comptes de production à `if (adminEmail && adminPassword)`. La condition est donc **fausse** : le seed bascule sur sa **branche mock/dev** et crée `admin@partiva.dev`, `user@partiva.dev`, `viewer@partiva.dev`, `client2@partiva.dev`, tous avec le mot de passe `PartIVA-dev-2026!`. L'étape `playwright test` demande ensuite les comptes `E2E_ADMIN_EMAIL` / `E2E_USER_EMAIL` / `E2E_VIEWER_EMAIL` avec `E2E_*_PASSWORD`. **Le compte ADMIN demandé n'existe pas en base** → Better Auth journalise `User not found` et répond `401 INVALID_EMAIL_OR_PASSWORD`. Les tentatives répétées saturent ensuite le rate limit (3/10 s) → `429` en cascade, ce qui masque la cause réelle et fait échouer toute la suite en `chromium`.

**Preuve qui l'établit (chaîne complète, non contradictoire) :**

1. L'étape seed reçoit `{DATABASE_URL, DIRECT_URL, BETTER_AUTH_SECRET, ADMIN_PASSWORD}` — **pas** `ADMIN_EMAIL` → `ci-run-utf8.log` L1327-1333.
2. Le seed lit `process.env.ADMIN_EMAIL` et teste `if (adminEmail && adminPassword)` → `prisma/seed.ts:50-51,59` (@ `59fdba2`).
3. Le seed **annonce** lui-même le branchement → `ci-run-utf8.log` L1339 `⚠️  ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock (dev uniquement)`.
4. Les 4 comptes mock sont créés (L1363 `users: 4`) et l'on vérifie en base que leurs hash correspondent à `hashPassword('PartIVA-dev-2026!')` (§2.3, preuve C) — même sel `38ef092de119fee0fd42ea1c40a92f8d` pour les 4, signature d'un `hashPassword` unique réutilisé (`prisma/seed.ts:220`).
5. La suite demande un autre compte → `e2e/fixtures/users.ts:24-26` (source `E2E_ADMIN_EMAIL`) et `ci-run-utf8.log` L1394-1399 (secrets injectés).
6. Le serveur répond `User not found` → `ci-run-utf8.log` L1810, puis le setup ADMIN échoue en restant sur `/login` (L1817-1840).
7. Les specs `chromium` obtiennent `401` puis `429` → L1849, L1868, L1887, L1906, L1944, L2039, L2057, L2093.
8. Reproduction locale indépendante : `STATUS: 401` + `{"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}` pour un utilisateur inexistant, `STATUS: 200` pour `admin@partiva.dev` / `PartIVA-dev-2026!`.

**Niveau de certitude : certain.**

---

### 3.2 Cause racine n°2 — le rate limit Better Auth (INDÉPENDANTE, BLOQUANTE)

Énoncé et preuves : §2.5. En résumé : ≈ **104** sign-ins par run contre un plafond de **3 / 10 s** (activation production uniquement), quota consommé **avant** le handler, clé unique par IP. **Même après correction de la cause n°1, la suite échouerait sur des `429`.**

Preuve la plus directe dans le log CI : la transition observée `401 → 401 → 429 → 429 → …` sur des tests **strictement identiques** (`authRequest` identique, ligne identique) ne s'explique que par la saturation du bucket.

**Niveau de certitude : certain.**

---

### 3.3 Cause racine n°3 — l'arbre de travail ne compile plus (état actuel, distinct de la CI analysée)

Cette cause n'a pas produit le run analysé (commit `59fdba2`), mais elle **empêchera tout run futur** et doit être traitée dans la même session.

**3.3.a — `prisma/seed.ts` (working tree) : erreur de zone morte temporelle (TDZ)**

Les emails E2E sont **déclarés après** leur usage :

```ts
// prisma/seed.ts:88-95   →  utilisation
const e2eUser = await prisma.user.upsert({
  where: { email: e2eUserEmail },     // ← L89
…
// prisma/seed.ts:132    →  déclaration (43 lignes plus bas)
const e2eUserEmail = process.env.E2E_USER_EMAIL ?? 'user@partiva.dev';
```

Preuve — `npx tsc --noEmit --pretty false --incremental false` sur l'arbre de travail (**exit code 2**) :

```
prisma/seed.ts(89,23): error TS2448: Block-scoped variable 'e2eUserEmail' used before its declaration.
prisma/seed.ts(89,23): error TS2454: Variable 'e2eUserEmail' is used before being assigned.
prisma/seed.ts(92,16): error TS2448: Block-scoped variable 'e2eUserEmail' used before its declaration.
prisma/seed.ts(92,16): error TS2454: Variable 'e2eUserEmail' is used before being assigned.
prisma/seed.ts(98,23): error TS2448: Block-scoped variable 'e2eViewerEmail' used before its declaration.
prisma/seed.ts(101,16): error TS2448: Block-scoped variable 'e2eViewerEmail' used before its declaration.
prisma/seed.ts(107,23): error TS2448: Block-scoped variable 'e2eClient2Email' used before its declaration.
prisma/seed.ts(110,16): error TS2448: Block-scoped variable 'e2eClient2Email' used before its declaration.
```

Et surtout, **`npm run build` échoue** (le build Next type-check `prisma/seed.ts`) :

```
▲ Next.js 16.4.0 (Turbopack)
  Creating an optimized production build ...
✓ Compiled successfully in 7.4s
  Running TypeScript ...
prisma/seed.ts(89,23): error TS2448: Block-scoped variable 'e2eUserEmail' used before its declaration.
…
Failed to type check.
```

→ `webServer: 'npm run build && npm run start'` échoue ⇒ Playwright attend 180 s puis **tous** les tests échouent. Et le job `typecheck` (`npx tsc --noEmit`) échoue ⇒ le job `e2e` est bloqué (`needs: [lint, typecheck, build]`).

**3.3.b — `prisma/seed.ts` @ HEAD `b99b634` : redéclarations (SyntaxError)**

HEAD déclare les mêmes variables **deux fois** dans le même bloc (L131-136 et L168-173) ⇒ **SyntaxError au parsing**, le seed ne peut même pas être chargé.

Preuve — `tsc` sur l'extraction de HEAD :

```
seed-b99b634.ts(131,11): error TS2451: Cannot redeclare block-scoped variable 'e2eUserPassword'.
seed-b99b634.ts(132,11): error TS2451: Cannot redeclare block-scoped variable 'e2eViewerPassword'.
seed-b99b634.ts(133,11): error TS2451: Cannot redeclare block-scoped variable 'e2eClient2Password'.
seed-b99b634.ts(134,11): error TS2451: Cannot redeclare block-scoped variable 'e2ePasswordHashUser'.
seed-b99b634.ts(135,11): error TS2451: Cannot redeclare block-scoped variable 'e2ePasswordHashViewer'.
seed-b99b634.ts(136,11): error TS2451: Cannot redeclare block-scoped variable 'e2ePasswordHashClient2'.
seed-b99b634.ts(168,11): error TS2451: Cannot redeclare block-scoped variable 'e2eUserPassword'.
… (12 erreurs au total)
```

La même erreur existe à `e8071ec` (12 erreurs TS2451) — absent de `59fdba2` (0 erreur). **La régression a été introduite par `e8071ec`.**

**3.3.c — `.github/workflows/ci.yml` @ HEAD `b99b634` : YAML invalide**

Deux steps `- run: npx prisma db seed` superposés, dont un avec `env:` vide, et surtout **`DATABASE_URL` et `ADMIN_PASSWORD` déclarés deux fois** dans le même mapping :

```yaml
      - run: npx prisma db seed
        env:
      - run: npx prisma db seed
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
          E2E_VIEWER_PASSWORD: ${{ secrets.E2E_VIEWER_PASSWORD }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}     ← doublon
          ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}   ← doublon
```

Preuve — parseur YAML strict :

```
YAMLException: duplicated mapping key (79:11)
 78 |           E2E_ADMIN_EMAIL: ${{ secrets.E ...
 79 |           DATABASE_URL: ${{ secrets.DATAB ...
```

Introduit par le commit `b99b634` lui-même :

```diff
       - run: npx prisma db seed
         env:
+      - run: npx prisma db seed
+        env:
+          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

**3.3.d — `e2e/setup/auth.setup.ts` : le journal de diagnostic ajouté par `e8071ec` ne s'affiche jamais**

Le `catch` appelle `page.evaluate(...)` — or quand l'échec est un **timeout de test**, la page a déjà été fermée ⇒ `page.evaluate` **rejette** et masque l'erreur d'origine :

```
Error: page.evaluate: Target page, context or browser has been closed
  > 25 |       const contextInfo = await page.evaluate(() => {
      at F:\PartIVA\e2e\setup\auth.setup.ts:25:38
```

Le `console.error('AUTH SETUP FAILED for', …)` **prévu par le commit n'est jamais atteint** (le `console.error` est *après* le `page.evaluate`). Le message `AUTH SETUP FAILED` est **absent** de `ci-run-utf8.log` — confirmé par grep. **C'est pour cette raison que 2 jours de diagnostic ont été nécessaires** : l'instrumentation censée "fail loudly" est elle-même muette.

**3.3.e — régression Prettier : le job `lint` de la CI échoue avant le job `e2e`**

Le job **« ESLint + Prettier »** exécute `npm run format:check` (`ci-run-utf8.log` L177-182). Or, **au commit HEAD `b99b634`**, deux fichiers échouent déjà à ce contrôle :

```
$ npx prettier --check <version HEAD de prisma/seed.ts>          → [warn] Code style issues found
$ npx prettier --check <version HEAD de e2e/setup/auth.setup.ts> → [warn] Code style issues found
```

La régression a été introduite par les commits `e8071ec` / `b99b634` (le run de référence `59fdba2` passait `format:check`, son job `lint` étant vert — condition nécessaire pour que le job `e2e` s'exécute).

→ **Au commit `b99b634`, le job `e2e` n'aurait jamais été exécuté** : `needs: [lint, typecheck, build]` et le job `lint` échoue. C'est une **4ᵉ cause bloquante**, distincte de l'authentification, et elle explique une partie du « CI bloqué depuis 2 jours ».

*Méthode de vérification :* les versions HEAD ont été extraites **dans l'arborescence du projet** (`.tmp-prettier-head/`) pour que Prettier applique `.prettierrc.json` du projet — une extraction hors projet utilise la configuration par défaut (guillemets doubles) et produit un faux positif.

**Niveau de certitude : certain.**

---

## 4. Ce qui a été écarté (et pourquoi)

| Hypothèse | Verdict | Preuve d'élimination |
|---|---|---|
| **Le sign-in renvoie 400** | **ÉCARTÉE** | Better Auth 1.7.7 : `APIError.from("UNAUTHORIZED", INVALID_EMAIL_OR_PASSWORD)` ⇒ 401. Sonde locale : `STATUS: 401` / `STATUS: 200` / `STATUS: 429`. Aucun `400` pour un sign-in. Les `400` du log sont des **noms de tests**. |
| **Hachage / sel / algorithme incompatibles** | **ÉCARTÉE** | `verifyPassword()` de better-auth valide les 4 hash stockés contre `PartIVA-dev-2026!` ⇒ `true`. Format `sel32hex:hash` conforme à `hashPassword()`. Le seed utilise `hashPassword` de `better-auth/crypto` (§2.3). |
| **Le seed est en base dans la CI** | **ÉCARTÉE (c'est l'inverse)** | L'arbre de travail **corrige** la résolution (`E2E_ADMIN_EMAIL ?? ADMIN_EMAIL`) mais **casse le build** (TS2448). Le commit du run CI ne lisait que `ADMIN_EMAIL`. |
| **Le serveur Next.js ne démarre pas** | **ÉCARTÉE** | `✓ Compiled successfully in 869ms`, 159 tests passés, `/api/healthcheck` 200, pages publiques 200 (§2.7). |
| **Le `Origin` manquant → 403 CSRF** | **ÉCARTÉE pour Playwright** | Sonde : `fetch` nu sans `Origin` ⇒ `403 MISSING_OR_NULL_ORIGIN` ; mais Playwright `APIRequestContext` **injecte** `Origin` depuis `baseURL` ⇒ `STATUS: 200`. Cohérent avec le log CI (401/429, jamais 403). `e2e/auth-api.spec.ts:19-20` ajoute `Origin` explicitement, mais c'est superflu. |
| **Rate limit = cause racine unique** | **ÉCARTÉE comme cause unique** | Le rate limit (429) est un **amplificateur**, pas l initiateur : les **deux** premiers échecs sont des `401` (L1849, L1868) dus au compte inexistant. Mais il est une cause **indépendante et bloquante** à lui seul (§2.5). |
| **Parallélisme / workers** | **ÉCARTÉE** | `workers: 1` (`playwright.config.ts:13`). Le plafond est franchi par le **volume total** (≈104 vs ≈45 max sur 150 s), pas par la concurrence. |
| **Cache npm / registry / 401 npm** | **ÉCARTÉE pour ce run** | `docs/sessions/rapports/README-CI-DIAGNOSTIC.md` portait sur un run antérieur (échec `npm ci`). Dans le run `39742458817`, `npm ci` est passé (✔) et l'échec est sur `npm run test:e2e` (`##[error]Process completed with exit code 1.` L3914). |
| **`E2E_CLIENT2_*` manquant** | **ÉCARTÉE comme cause** | `E2E_CLIENT2_*` est absent du run analysé, mais aucun test de `chromium` ne dépend de `client2` : les échecs portent sur ADMIN/USER/VIEWER. (À corriger, mais pas la cause.) |
| **`prisma.config.ts` vs `prisma7.config.ts`** | **ÉCARTÉE pour l'impact** | Les deux fichiers sont identiques (16 lignes) ; Prisma charge `prisma7.config.ts`. Aucun écart de comportement, mais c'est une ambiguïté à supprimer. |

---

## 5. Recommandation

> **Aucun correctif n'a été appliqué** (phase diagnostic). Les corrections ci-dessous sont la recommandation ; leur application demande l'autorisation du coordinateur.

### 5.1 Correctif minimal — cause n°1 (seed ↔ setup)

**Principe : une seule et même source de vérité pour les identifiants E2E, lue de façon identique par le seed et par la suite de tests.**

**Fichier `prisma/seed.ts`** — remonter la déclaration des emails E2E **avant** leur première utilisation, et unifying la résolution avec `e2e/fixtures/users.ts` :

- déplacer les 3 `const e2eUserEmail / e2eViewerEmail / e2eClient2Email` **au-dessus** du bloc `if (adminEmail && adminPassword) {` (actuellement L132-134, à utiliser L88-114) ;
- conserver `const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;` (L51) — **déjà présent dans l'arbre de travail, à conserver** ;
- supprimer **toute** redéclaration (les blocs L131-136 et L168-173 de HEAD sont en double : ne conserver qu'un seul jeu de déclarations, placées avant usage).

**Fichier `.github/workflows/ci.yml`** — supprimer le step `- run: npx prisma db seed` en double et les clés YAML dupliquées, puis passer **les mêmes** variables au seed et aux tests :

```yaml
      - run: npx prisma db seed
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          E2E_USER_EMAIL: ${{ secrets.E2E_USER_EMAIL }}
          E2E_USER_PASSWORD: ${{ secrets.E2E_USER_PASSWORD }}
          E2E_VIEWER_EMAIL: ${{ secrets.E2E_VIEWER_EMAIL }}
          E2E_VIEWER_PASSWORD: ${{ secrets.E2E_VIEWER_PASSWORD }}
          E2E_CLIENT2_EMAIL: ${{ secrets.E2E_CLIENT2_EMAIL }}
          E2E_CLIENT2_PASSWORD: ${{ secrets.E2E_CLIENT2_PASSWORD }}
```

> Point de vigilance : le `seed` **écrase** la base (27 `deleteMany`). Les secrets GitHub `E2E_*` doivent pointer vers des comptes dédiés à la CI, et non vers des comptes de production.

**Alternative structurelle (recommandée à terme) :** extraire la résolution des identifiants dans un module partagé (ex. `e2e/fixtures/users.ts`) importé **par le seed également**, afin qu'il n'y ait qu'une seule liste d'env vars possibles. Supprimer au passage le fallback silencieux `'PartIVA-dev-2026!'` (`e2e/fixtures/users.ts:22`), qui masque les erreurs de configuration.

### 5.2 Correctif minimal — cause n°2 (rate limit)

**Fichier `src/lib/auth.ts`** — désactiver la limite de taux sur la route de sign-in **uniquement en environnement de test E2E**, via `rateLimit.customRules` (mécanisme supporté : `dist/api/rate-limiter/index.mjs:262-278`, `resolved === false` ⇒ pas de bucket) :

```ts
rateLimit: {
  customRules: {
    '/sign-in/email': process.env.E2E_DISABLE_RATE_LIMIT === 'true' ? false : undefined,
  },
},
```

et dans `ci.yml`, étape `test:e2e` : `E2E_DISABLE_RATE_LIMIT: 'true'`.

**Alternative (à privilégier) :** réduire drastiquement le nombre de sign-ins — partager un `storageState` entre specs au lieu de rejouer `authRequest` à chaque test (96 appels). Le correctif §5.2 seul est cependant suffisant et immédiat.

### 5.3 Correctif minimal — cause n°3 (build)

1. `prisma/seed.ts` : corriger la TDZ (§5.1, bullet 1) et supprimer les redéclarations (§5.1, bullet 3).
2. `.github/workflows/ci.yml` : corriger le YAML invalide (§5.1, bullet 2).
3. Vérifier par : `npx tsc --noEmit` (attendu exit 0) **puis** `npm run build` (attendu « ✓ Compiled successfully » + pas de « Failed to type check »).

### 5.4 Correctif — instrumentation (fortement recommandé)

**Fichier `e2e/setup/auth.setup.ts`** — rendre le bloc `catch` réellement bruyant : envelopper le `page.evaluate` dans son propre `try/catch` (ou le supprimer) pour que le `console.error('AUTH SETUP FAILED for', …)` soit toujours atteint, et **ajouter la capture du corps de la réponse sign-in** demandée au §1.6 du prompt :

```ts
const res = await page.request.post('/api/auth/sign-in/email', {
  data: { email: user.email, password: user.password },
});
console.log('STATUS:', res.status());
console.log('BODY:', await res.text());
```

Sans cela, **tout diagnostic futur butera à nouveau contre un silence**.

### 5.5 Ordre d'application recommandé (une seule session)

| # | Action | Fichier | Validation |
|---|---|---|---|
| 1 | Corriger TDZ + redéclarations | `prisma/seed.ts` | `npx tsc --noEmit` → exit 0 |
| 2 | Corriger YAML + variables | `.github/workflows/ci.yml` | parseur YAML strict → OK |
| 3 | Lever le rate limit E2E | `src/lib/auth.ts` + `ci.yml` | `npm run build` → OK |
| 4 | Rendre le setup bruyant | `e2e/setup/auth.setup.ts` | log `STATUS:`/`BODY:` visible |
| 5 | Vérifier le build | — | `npm run build` → « ✓ Compiled successfully », pas de « Failed to type check » |
| 6 | Rejouer le seed en local avec les bonnes variables, puis `npx playwright test --project=setup` | — | 3 setups verts |
| 7 | Relancer la CI | — | run vert |

> **Ne pas relancer la CI avant l'étape 5** : au commit `b99b634`, le job `typecheck` échoue et le job `e2e` n'est jamais exécuté — une relance ne produirait qu'un signal trompeur.

---

## 6. Ce qui manque / limites de cette analyse

- **Valeurs des secrets GitHub** (`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, …) : non lisibles depuis le dépôt. L'inférence « `E2E_ADMIN_EMAIL` ≠ `admin@partiva.dev` » repose sur `WARN [Better Auth]: User not found` + `users: 4` + le hash unique en base — **preuve suffisante**, mais la valeur exacte reste à confirmer par l'administrateur du dépôt.
- **Le run `e8071ec` / `b99b634`** : aucun log de CI n'est présent dans le dépôt pour ces commits (seul `59fdba2` est archivé). L'état exact de la CI pour ces commits est **déduit** de l'analyse statique (TS2451, YAML invalide) — certitude « certain » sur le diagnostic local, « probable » sur le rendu exact de GitHub Actions.
- **`e2e/helpers/`** : n'existe pas — la demande était obsolète sur ce point.

---

*Diagnostic réalisé sans aucune modification du code produit. Les seules écritures hors dépôt sont des scripts de sonde dans `C:\Users\pc\AppData\Local\Temp\kilo\`.*

---
---

# PARTIE II — CORRECTION ET VALIDATION (E27)

> Autorisation reçue de l'IA externe (Supervisor) pour appliquer les 4 étapes du plan d'action.
> Corrections appliquées et validées localement le 2026-10-22. **Aucun commit effectué** (en attente du workflow de commit proposé en §7.5).

## 7.1 Corrections appliquées

### Étape 1 — Compilabilité

> **1 bis — régression Prettier (job `lint`).** `prisma/seed.ts` et `e2e/setup/auth.setup.ts` échouaient déjà à `npm run format:check` au commit HEAD (§3.3.e) : le job `lint` de la CI aurait bloqué le job `e2e`. `npx prettier --write` a été appliqué à `prisma/seed.ts`, `.github/workflows/ci.yml` et `e2e/setup/auth.setup.ts` → `prettier --check .` → **« All matched files use Prettier code style! »**.

**`prisma/seed.ts`** — les 3 déclarations `e2e*Email` remontées **avant** leur première utilisation (TDZ) ; suppression des redéclarations (TS2451) ; les 3 upserts utilisent désormais les variables résolues et non plus des littéraux `'user@partiva.dev'` :

```diff
+    // E2E emails — même résolution que e2e/fixtures/users.ts (évite les 401).
+    // Déclarés AVANT leur première utilisation (E27) : `const` est sujet à la
+    // temporal dead zone, une déclaration plus bas provoquerait un
+    // ReferenceError à l'exécution (« used before its declaration »).
+    const e2eUserEmail = process.env.E2E_USER_EMAIL ?? 'user@partiva.dev';
+    const e2eViewerEmail = process.env.E2E_VIEWER_EMAIL ?? 'viewer@partiva.dev';
+    const e2eClient2Email = process.env.E2E_CLIENT2_EMAIL ?? 'client2@partiva.dev';
+
     const e2eUser = await prisma.user.upsert({
-      where: { email: 'user@partiva.dev' },
+      where: { email: e2eUserEmail },
```

Le bloc dupliqué (2ᵉ jeu `const e2eUserPassword` … + 2 upserts redondants `e2ePasswordHash`) a été supprimé : `-34 lignes`.

**`.github/workflows/ci.yml`** — le step seed en double et les clés YAML dupliquées (`DATABASE_URL`, `ADMIN_PASSWORD`) étaient **déjà corrigés** dans l'arbre de travail (non commités). La correction E27 a consisté à **conserver** cette structure et à y ajouter la variable du rate limit (§7.1, étape 3).

### Étape 2 — Synchronisation seed ↔ tests

**`prisma/seed.ts:50-51`** (résolution unifiée — déjà présente dans l'arbre de travail, conservée) :

```ts
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
```

**`.github/workflows/ci.yml`** — l'étape `npx prisma db seed` reçoit désormais **exactement** les mêmes variables que l'étape `npm run test:e2e` :

```
DATABASE_URL, DIRECT_URL,
ADMIN_EMAIL=E2E_ADMIN_EMAIL, ADMIN_PASSWORD=E2E_ADMIN_PASSWORD,
E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD,
E2E_USER_EMAIL, E2E_USER_PASSWORD,
E2E_VIEWER_EMAIL, E2E_VIEWER_PASSWORD,
E2E_CLIENT2_EMAIL, E2E_CLIENT2_PASSWORD
```

Table de correspondance seed ↔ `e2e/fixtures/users.ts` après correction :

| Rôle | Seed (`prisma/seed.ts`) | Test (`e2e/fixtures/users.ts`) | Identique |
|---|---|---|---|
| ADMIN | `E2E_ADMIN_EMAIL ?? ADMIN_EMAIL` | `E2E_ADMIN_EMAIL ?? ADMIN_EMAIL ?? 'admin@partiva.dev'` | ✅ |
| USER | `E2E_USER_EMAIL ?? 'user@partiva.dev'` | `E2E_USER_EMAIL ?? 'user@partiva.dev'` | ✅ |
| VIEWER | `E2E_VIEWER_EMAIL ?? 'viewer@partiva.dev'` | `E2E_VIEWER_EMAIL ?? 'viewer@partiva.dev'` | ✅ |
| client2 | `E2E_CLIENT2_EMAIL ?? 'client2@partiva.dev'` | (non utilisé par la suite) | ✅ |

### Étape 3 — Rate limit

**`src/lib/auth.ts`** :

```ts
  // E27 — Better Auth limite par défaut /sign-in/* à 3 requêtes / 10 s
  // (node_modules/better-auth/dist/api/rate-limiter/index.mjs, getDefaultSpecialRules).
  // La suite Playwright émet ~104 sign-ins par run (authRequest + sign-in directs) :
  // sans levée explicite, tout appel au-delà du 3e renvoie 429 et masque la cause
  // réelle des échecs. Levée strictement via E2E_DISABLE_RATE_LIMIT=true (job CI « e2e »
  // uniquement) — la production conserve la limite par défaut.
  rateLimit:
    process.env.E2E_DISABLE_RATE_LIMIT === 'true'
      ? { customRules: { '/sign-in/email': false } }
      : {},
```

Type vérifié dans `@better-auth/core/dist/types/init-options.d.mts:207` :
`customRules?: { [key: string]: BetterAuthRateLimitRule | false | (…) => Awaitable<false | BetterAuthRateLimitRule> }` → `false` est une valeur valide et désactive le bucket pour ce chemin (`rate-limiter/index.mjs:277` → `return null`).

**`.github/workflows/ci.yml`** (job `e2e`, étape `test:e2e`) : `E2E_DISABLE_RATE_LIMIT: 'true'`.

### Étape 4 — Instrumentation

**`e2e/setup/auth.setup.ts`** — capture de la réponse brute `POST /api/auth/sign-in/email` (statut + corps) avant le clic, et `catch` rendu infaillible :

```ts
      const signInResponse = page
        .waitForResponse((r) => r.url().includes('/api/auth/sign-in/email'), { timeout: 15_000 })
        .then(async (r) => {
          const status = r.status();
          let body = '<body unavailable>';
          try { body = await r.text(); } catch { /* page déjà naviguée */ }
          return { status, body };
        })
        .catch(() => null);
      …
      console.log(
        `[auth.setup] ${user.role} POST /api/auth/sign-in/email -> STATUS: ${res ? res.status : 'NO_RESPONSE'} BODY: ${res ? res.body : '<none>'}`,
      );
```

et le `page.evaluate` du `catch` est encadré (`try/catch`) → le journal `AUTH SETUP FAILED` est désormais **toujours** atteint.

## 7.2 Validation — commandes et résultats

| # | Commande | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 1 | `npx tsc --noEmit --pretty false --incremental false` | exit 0 | **exit 0** ✅ (12 erreurs TS2448/TS2454 éliminées) |
| 2 | `npm run lint` | exit 0 | **exit 0** ✅ |
| 2b | `npm run format:check` | exit 0 | **exit 0** ✅ (`All matched files use Prettier code style!`) — voir §3.3.e |
| 2c | `npm run build` (après reformatage) | ✓ Compiled successfully | **✓ Compiled successfully in 5.8s**, `BUILD_ID` + `required-server-files.json` présents ✅ |
| 3 | `npm run build` | ✓ Compiled successfully | **✓ Compiled successfully in 6.9s**, `Finished TypeScript in 9.6s`, 52 pages statiques, 0 route en erreur ✅ |
| 4 | Parse YAML strict de `ci.yml` | pas d'erreur | **OK**, 1 seul step seed, 14 clés d'env sur `test:e2e` ✅ |
| 5 | `npm run db:seed` | exit 0, pas de ReferenceError | **exit 0**, `✅ Seed completed successfully!`, 4 users, sels distincts ✅ |
| 6 | `npx playwright test --project=setup` | 4 passed | **4 passed (16.0s)** — ADMIN/USER/VIEWER en `STATUS: 200` ✅ |
| 6b | `npm run db:seed` + `npm run build` + `npx playwright test --project=setup` **(après reformatage Prettier)** | exit 0 / ✓ / 4 passed | **SEED_EXIT=0**, **✓ Compiled successfully in 5.8s**, **4 passed (22.6s)** ✅ |
| 7 | `npm run test:e2e` (suite complète) | aucun échec d'authentification | **336 passed / 5 failed / 4 skipped (6.2m)** ✅ |

## 7.3 Preuve de la correction du rate limit (cause n°2)

Extraits de la suite complète (les ~104 sign-ins sont désormais tolérés) :

```
ok  11 [chromium] › e2e\api.spec.ts:29:5 › api: /api/parts GET with ADMIN returns all parts (1.4s)
ok  28 [chromium] › e2e\auth-api.spec.ts:23:7 › POST /api/auth/sign-in/email — valid credentials establish session (628ms)
ok  29 [chromium] › e2e\auth-api.spec.ts:46:7 › POST /api/auth/sign-in/email — invalid password returns 401 (344ms)
ok 261 [setup] › authenticate as ADMIN (5.2s)      → STATUS: 200
ok 262 [setup] › authenticate as USER (2.0s)       → STATUS: 200
ok 263 [setup] › authenticate as VIEWER (2.1s)     → STATUS: 200
```

Le test `auth-api.spec.ts:46` (« invalid password returns **401** ») était le **premier** à recevoir `429` en CI (L2057) : il reçoit maintenant **401**, ce qui prouve que le bucket n'est plus saturé.

## 7.4 Comparaison avant / après

| | CI run `39742458817` (commit `59fdba2`) | Après correction (local) |
|---|---|---|
| Tests passés | 159 | **336** |
| Tests en échec | 17 | **5** |
| Non exécutés | 81 | 0 |
| Skippés | 3 | 4 |
| Durée | 2.5m | 6.2m |
| Cause principale des échecs | seed ↔ tests désynchronisés + rate limit | **plus aucun échec d'authentification** |

## 7.5 Les 5 échecs restants — pré-existants et sans rapport avec l'authentification

Preuve de pré-existence : les 4 premiers étaient **déjà en échec dans le run CI de référence**, avec les **mêmes numéros de test** :

| # | Test | Statut CI `59fdba2` | Cause | Rapporté à l'auth ? |
|---|---|---|---|---|
| 24 | `api: /api/desktop/sync/manifest GET with ADMIN returns tables and direction` | ❌ (L1557) | liste de tables codée en dur dans le test ; l'API renvoie 2 tables de plus (`material`, `request`) | **Non** — dérive de test |
| 59 | `api: POST /api/parts/[id]/attachments creates an attachment` | ❌ (L1594) | `400` (configuration Cloudinary absente) | **Non** |
| 61 | `api: DELETE /api/parts/[id]/attachments/[attachmentId] returns 204` | ❌ (L1596) | conséquence en cascade du #59 | **Non** |
| 97 | `api: GET /api/parts/[id]/versions with auth returns 200 and non-empty list` | ❌ (L1636) | 0 version pour la pièce sélectionnée (donnée) | **Non** |
| 32 | `backfill script exits 0 without HF_API_TOKEN` | ✅ (660 ms en CI) | timeout 30 s **local uniquement** : `execFile('npx', …, { shell: true })` est lent/hang sur Windows | **Non** — artefact d'environnement local |

→ **Aucun échec lié à l'authentification, au seed ou au rate limit ne subsiste.**

## 7.6 Preuve que la boucle de diagnostic est désormais muette

Avant correction (état du run CI) — le journal `AUTH SETUP FAILED` **n'apparaît pas** dans `ci-run-utf8.log` (vérifié par grep) et le `page.evaluate`.maskait l'erreur :

```
Error: page.evaluate: Target page, context or browser has been closed
```

Après correction — le diagnostic est explicite :

```
[auth.setup] ADMIN POST /api/auth/sign-in/email -> STATUS: 401 BODY: {"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}
AUTH SETUP FAILED for ADMIN {
  email: 'ahmedyoussefabbes@gmail.com',
  passwordSet: true,
  pageContext: { hasLoginFields: false },
  error: 'expect(page).not.toHaveURL(expected) failed … Received string: "http://localhost:3000/login"'
}
```

## 7.7 Réserves et points d'attention

1. **La base Neon partagée a été re-seedée localement** (`npm run db:seed` → 27 `deleteMany`). C'est l'opération standard du projet, faite par la CI à chaque run ; la base ne contient que des données synthétiques. **La CI re-seedera de toute façon.**
2. **Les secrets GitHub doivent pointer vers des comptes dédiés à la CI.** Si `E2E_ADMIN_EMAIL` valait `admin@partiva.dev` et `E2E_ADMIN_PASSWORD` valait `PartIVA-dev-2026!`, le bug serait **masqué** par la branche mock et resurgirait à la première rotation. Le seed échoue bruyamment (`⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock`) : **ce message doit être traité comme une erreur en CI, pas comme un avertissement.**
3. **`chromium` et `public` ne déclarent pas `dependencies: ['setup']`** (`playwright.config.ts:35-44`) : le projet `setup` s'exécute donc **après** `chromium` (test n° 261 sur 345). Sans impact tant que le rate limit est levé, mais c'est une fragilité structurelle (le `storageState` n'est pas disponible pour `chromium`).
4. **La levée du rate limit est conditionnée à `E2E_DISABLE_RATE_LIMIT=true`.** La production conserve la limite Better Auth par défaut. Une solution structurelle (mutualiser un `storageState` entre specs au lieu de rejouer `authRequest` 96 fois) reste préférable à terme.
5. **Le job `build` de la CI utilise un `DATABASE_URL` placeholder** (modification pré-existante non commitée) ; elle est cohérente avec les 9 pages `export const dynamic = 'force-dynamic'` ajoutées dans l'arbre de travail. **Non vérifié en CI** (le build local utilise la vraie URL).
6. **Le diff `ci.yml` affiché** mélange mes changements et des modifications antérieures non commitées (double `npm run format:check`, placeholder `DATABASE_URL`, suppression d'une ligne vide). Je n'ai touché qu'à l'ajout de `E2E_DISABLE_RATE_LIMIT`.

## 7.8 Commits proposés (NON exécutés)

Trois commits atomiques, dans l'ordre :

> Le reformatage Prettier (§3.3.e) est **inclus** dans les commits 1 et 3 : les fichiers `prisma/seed.ts`, `.github/workflows/ci.yml` et `e2e/setup/auth.setup.ts` étaient déjà non conformes au formatage du projet **au commit HEAD**, indépendamment des corrections E27. Sans ce reformatage, le job `lint` de la CI échoue et le job `e2e` n'est jamais exécuté.

```bash
# 1 — Compilabilité (seed + CI)
git add prisma/seed.ts .github/workflows/ci.yml
git commit -m "fix(ci): corriger TDZ et redéclarations dans prisma/seed.ts, YAML dupliqué dans ci.yml

- remonte les déclarations e2e*Email avant leur usage (TS2448/TS2454)
- supprime le bloc dupliqué e2eUserPassword/e2ePasswordHash (TS2451 x12)
- supprime le step seed en double et les clés YAML dupliquées
- injecte les mêmes variables E2E_* au seed et aux tests

Refs: E27"

# 2 — Rate limit
git add src/lib/auth.ts .github/workflows/ci.yml
git commit -m "fix(auth): lever la limite de taux Better Auth pendant le run E2E

Better Auth limite /sign-in/* à 3 requêtes / 10 s. La suite E2E émet
~104 sign-ins par run : tous les appels au-delà du 3e renvoyaient 429
et masquaient la cause réelle des échecs.

La levée est conditionnée à E2E_DISABLE_RATE_LIMIT=true (job CI « e2e »).
La production conserve la limite par défaut.

Refs: E27"

# 3 — Instrumentation du setup
git add e2e/setup/auth.setup.ts
git commit -m "test(e2e): journaliser statut + corps de la réponse sign-in dans auth.setup

Le catch appelait page.evaluate, qui rejette quand la page a été fermée
après un timeout : le journal AUTH SETUP FAILED n'était jamais atteint
et masquait la cause réelle. Le page.evaluate est encadré et la réponse
brute POST /api/auth/sign-in/email est journalisée.

Refs: E27"
```

> **Aucun commit n'a été créé.** Les fichiers modifiés restent en l'état dans l'arbre de travail.

## 7.9 Recommandation pour la suite

1. **Ne pas relancer la CI avant d'avoir commité** : l'arbre de travail contient des modifications non commitées depuis plusieurs sessions ; les committer d'abord (3 commits ci-dessus) pour que le run CI teste exactement l'état commité.
2. Vérifier dans le log du nouveau run que la ligne `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock` **est absente** — sa présence signalerait que les secrets GitHub ne sont pas alignés.
3. Vérifier que le job `typecheck` est vert (il l'est localement : `tsc --noEmit` exit 0).
4. **Les 4 échecs pré-existants** (#24, #59, #61, #97) sont hors périmètre E27 : ils doivent être suivis dans `docs/etat/DETTES.md` (dérive de test pour #24, dépendance Cloudinary pour #59/#61, hypothèse de données pour #97).
5. **Le job `build` avec `DATABASE_URL` placeholder** doit être vérifié sur le premier run CI (non reproductible localement de façon équivalente).

---
---

# PARTIE III — VALIDATION CI (E27)

> Suite à la demande de l'IA externe : déclencher un run CI sur le commit poussé, puis vérifier les deux lignes de vigilance.
> **3 commits supplémentaires** ont été produits pendant cette phase (`3d7664d`, `5a2ac01`) pour lever 2 bloqueurs de CI distincts, découverts par l'observation des logs.

## 8. Chronologie des runs CI

| Run | Commit | lint | typecheck | build | e2e | Verdict |
|---|---|---|---|---|---|---|
| `39772839392` | `7159dfe` | ✅ | ✅ | ❌ | ⏭️ bloqué | **Build** : `ECONNREFUSED` au prerender |
| `39774920188` | `3d7664d` | ✅ | ✅ | ✅ | ❌ 335/6/4 | 2 échecs `cookie-guard` (ENOENT `.auth/admin.json`) |
| `39777704765` | `5a2ac01` | ✅ | ✅ | ✅ | ❌ **337/4/4** | **Plus aucun échec d'authentification** |

> Rappel : `59fdba2` (run de référence `39742458817`) → 159 passés / 17 échecs / 81 non exécutés / 3 skipped.

## 9. Les 2 lignes de vigilance — VERDICT

| Ligne à vérifier | Résultat |
|---|---|
| `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock` | **ABSENTE** ✅ — le seed et les tests utilisent bien les mêmes identifiants |
| `429` sur `sign-in` | **ABSENT** ✅ — `E2E_DISABLE_RATE_LIMIT` fonctionne |

Preuve (run `39777704765`, job E2E) :

```
✓   28 [chromium] › e2e/auth-api.spec.ts:23:7 › POST /api/auth/sign-in/email — valid credentials establish session (781ms)
✓   29 [chromium] › e2e/auth-api.spec.ts:46:7 › POST /api/auth/sign-in/email — invalid password returns 401 (361ms)
[auth.setup] ADMIN POST /api/auth/sign-in/email -> STATUS: 200
[auth.setup] USER POST /api/auth/sign-in/email -> STATUS: 200
[auth.setup] VIEWER POST /api/auth/sign-in/email -> STATUS: 200
```

> Le test `auth-api.spec.ts:46` (« invalid password returns 401 ») est celui qui recevait **429** en CI (`ci-run-utf8.log` L2057) : il reçoit maintenant **401**, ce qui prouve que le bucket de rate limit n'est plus saturé.

## 10. Blocage n°5 — le job `build` échouait (résolu par `3d7664d`)

**Symptôme** (run `39772839392`) :

```
Error occurred prerendering page "/admin/reverse-engineering/placeholder".
Error [PrismaClientKnownRequestError]: Invalid `prisma.reverseEngineeringProject.findUnique()` invocation:
  code: 'ECONNREFUSED',
  at async h (src/app/admin/reverse-engineering/[id]/page.tsx:10:19)
Export encountered an error on /admin/reverse-engineering/[id]/page: /admin/reverse-engineering/placeholder, exiting the build.
⨯ Next.js build worker exited with code: 1
```

**Cause :** le job `build` utilise un `DATABASE_URL` placeholder (aucune base sur le runner), mais 4 routes exposaient `generateStaticParams() → [{ id: 'placeholder' }]` : Next les **pré-rendait** au build → requête Prisma → `ECONNREFUSED`.

Les 9 pages déjà corrigées par le pattern `force-dynamic` ne suffisaient pas : les 4 routes `[id]` avaient été oubliées.

**Correctif (`3d7664d`) :** `export const dynamic = 'force-dynamic'` ajouté à
`src/app/admin/demandes/[id]/page.tsx`, `src/app/admin/demandes/[id]/recherche/page.tsx`,
`src/app/admin/reverse-engineering/[id]/page.tsx`, `src/app/(public)/materiaux/[slug]/page.tsx`.

**Validation :** build local reproduit **avec** le `DATABASE_URL` placeholder → `✓ Compiled successfully`, `Generating static pages (52/52)`, **exit 0** ; puis `admin` + `public` + `viewer` = **87 tests passés** (les routes patchées répondent correctement).

## 11. Blocage n°6 — le projet `public` s'exécutait avant `setup` (résolu par `5a2ac01`)

**Symptôme** (run `39774920188`) :

```
✘  243 [public] › e2e/public/cookie-guard.spec.ts:39:7 › T2 — expired session cookie redirects… (102ms)
✘  244 [public] › … (retry #1)
✘  245 [public] › e2e/public/cookie-guard.spec.ts:61:7 › T4 — forged session cookie redirects… (103ms)
✘  246 [public] › … (retry #1)
Error: ENOENT: no such file or directory, open '/home/runner/work/PartIVA/PartIVA/.auth/admin.json'
```

**Cause :** `e2e/public/cookie-guard.spec.ts:35` lit `.auth/admin.json` **sur disque** (`loadAdminStorageState()`), mais le projet `public` ne déclarait **aucune** `dependencies` → il s'exécutait **avant** le projet `setup` qui produit ce fichier. En CI, `.auth/` n'existe pas au démarrage.

Preuve par les horodatages du run `39774920188` :

```
12:06:53  ✘  243 [public] … cookie-guard … T2
12:07:05  ✓  263 [setup] … authenticate as ADMIN
```

→ le projet `public` a tourné **12 s avant** `setup`.

**Correctif (`5a2ac01`) :** `dependencies: ['setup']` ajouté au projet `public` dans `playwright.config.ts`.

**Validation (run `39777704765`) :** les 2 tests `cookie-guard` passent → **337 passés / 4 échecs** (contre 335 / 6).

## 12. État final du run CI `39777704765` (commit `5a2ac01`)

```
✓ ESLint + Prettier   1m5s
✓ TypeScript          37s
✓ Build               1m4s
❌ E2E (Playwright)   337 passed / 4 failed / 4 skipped (6.2m)
```

Les 4 échecs restants sont **exactement** les 4 échecs pré-existants (mêmes numéros de test que le run de référence `39742458817`) :

| # | Test | Cause | Rapporté à l'auth |
|---|---|---|---|
| 24 | `api: /api/desktop/sync/manifest GET with ADMIN returns tables and direction` | liste de tables codée en dur dans le test (l'API renvoie `material` + `request` en plus) | Non |
| 59 | `api: POST /api/parts/[id]/attachments creates an attachment` | `Received: 400` + `[WebServer] Error uploading attachment: Error: Must supply api_key` → **Cloudinary sans `api_key` en CI** | Non |
| 61 | `api: DELETE /api/parts/[id]/attachments/[attachmentId] returns 204` | conséquence en cascade de #59 | Non |
| 97 | `api: GET /api/parts/[id]/versions with auth returns 200 and non-empty list` | `Received: 0` — hypothèse de données | Non |

> Le 5ᵉ échec « local » (`backfill-embeddings`, timeout 30 s) **passe en CI** : c'est un artefact Windows (`execFile('npx', …, { shell: true })`).

## 13. Réserves

1. **Le run est `failure` au global** (job E2E non vert) à cause des 4 échecs pré-existants. Les 3 jobs de base (`ESLint + Prettier`, `TypeScript`, `Build`) sont **verts**, et **tous les tests d'authentification passent**.
2. **La base Neon est partagée entre la CI et le développement local.** Chaque run CI re-seed la base avec les **secrets CI** → les identifiants du `.env` local ne correspondent plus → un run local du `setup` échoue en `401` tant qu'un `npm run db:seed` local n'a pas été rejoué. (Lors de cette session, le re-seed local a été bloqué par une coupure de connectivité Neon transitoire — `D-E23-PRISMA-POOLER-TIMEOUT`.)
3. **`chromium` reste sans `dependencies: ['setup']`** — c'est correct : ses specs font leur propre sign-in (`auth-api.spec.ts:7` : « no storageState, no setup dependency »). `public` était le seul projet avec une dépendance **non déclarée**, désormais corrigée.
4. **Le job `build` ne dispose toujours d'aucune base** : c'est désormaistenupossible grâce aux 13 routes en `force-dynamic`. Une route dynamique oubliée rebloquerait le build — un garde-fou (`generateStaticParams` interdit, ou test de build) serait utile.


