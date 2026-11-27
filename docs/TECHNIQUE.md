# Documentation technique — PartIVA PCB Studio

## Architecture

```
src/app/                     Routes Next.js 16 (App Router, Turbopack)
  admin/pcb/[id]/            Page projet + providers (wizard, live state, progression)
  api/pcb/
    requirements/            source-components (LLM), nets-only, nets
    place/                   batch, verify
    route/                   routage assisté
    autoroute/freerouting/   chaîne DSN → SES → DRC
    projects/[id]/           board (open/reset/launch/reload/show), glb, wizard-state
    export/fabrication/      Gerbers + Drill + BOM + Pos → ZIP
src/lib/pcb/
  placement.ts               Algorithme déterministe (force dirigée, recuit, passe séquentielle, densité, orientation)
  drc.ts                     DRC KiCad + catégorisation + violations pré-existantes
  dfm/jlcpcb-rules.ts        Profil JLCPCB + validateDfm
  netlist-validation.ts      Validation interne (remplace ERC)
  kicad-bridge.ts            Pont Node → Python (pcbnew)
  kicad-cli-adapter.ts       kicad-cli (ERC, DRC, Gerber, GLB)
  kicad-file-reader.ts       Parseur S-expression (.kicad_pcb)
scripts/kicad/               Scripts Python KiCad (place, route, specctra, net_assign, sync)
prisma/                      Schéma + migrations
tools/freerouting.jar        Binaire local (gitignoré)
desktop/                     Application Tauri (sidecar + installateurs)
```

## Dépendances

- **npm** : Next.js 16, React 19, Prisma 7 (`@prisma/adapter-pg`), Better Auth, three.js + @react-three/fiber/drei, JSZip, ExcelJS, Zod, Vitest, Playwright.
- **Binaires externes** : KiCad 10 (`kicad-cli`, Python `pcbnew`), Java 25 (Temurin), Freerouting 2.6.0.
- **BDD** : PostgreSQL (Neon en production), via `DATABASE_URL` (pooler) et `DIRECT_URL`.

## Variables d'environnement

Copier `.env.example` vers `.env.local`. Les plus importantes pour PCB :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Connexion Neon (Prisma adapter + migrations) |
| `BETTER_AUTH_SECRET` / `BETTER_AUTH_URL` | Sessions |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte admin (seed) |
| `PARTIVA_KICAD_CLI` | Chemin `kicad-cli.exe` (défaut `C:/Program Files/KiCad/10.0/bin/...`) |
| `PARTIVA_KICAD_PYTHON` | Python KiCad (défaut `C:/Program Files/KiCad/10.0/bin/python.exe`) |
| `PARTIVA_KICAD_FOOTPRINTS_ROOT` | Racine des bibliothèques d'empreintes |
| `PARTIVA_DESKTOP` | `1` en mode Tauri (ouverture/fermeture KiCad) |
| `FREEROUTING_JAR` / `FREEROUTING_JAVA` | Binaire/path Freerouting |
| `FREEROUTING_PASSES` | Passes d'optimisation (défaut 10) |
| `JLCPCB_APP_ID` / `JLCPCB_ACCESS_KEY` / `JLCPCB_SECRET_KEY` | Credentials API JLCPCB (optionnels) |
| `JLCPCB_ENDPOINT` / `JLCPCB_QUOTE_PATH` | Surcharge endpoint/chemin de devis (par défaut `https://open.jlcpcb.com` + `/overseas/openapi/pcb/calculatePrice`) |

### Obtenir un accès à l'API JLCPCB

1. Créer un compte sur [jlcpcb.com](https://jlcpcb.com).
2. Candidate sur [api.jlcpcb.com](https://api.jlcpcb.com) (l'approbation dépend de l'historique de commandes).
3. Après approbation, créer une application et relever `appId`, `accessKey` et `secretKey`.
4. Renseigner les trois variables dans `.env.local`.
5. Le devis utilise la signature JOP : `HMAC-SHA256(secretKey, "METHOD\nPATH\nTIMESTAMP\nNONCE\nBODY\n")` encodé en Base64, envoyé dans l'en-tête `Authorization`.

**Attention** : le chemin exact de l'endpoint de devis (`JLCPCB_QUOTE_PATH`) et le format de réponse doivent être validés par un test live avec de vraies credentials ; sans credentials, l'application affiche un message de configuration et n'appelle pas l'API.
| `LLM_*`, `GROQ_API_KEY`, `CEREBRAS_API_KEY` | Fournisseurs LLM (topologie uniquement) |

Les secrets ne sont jamais commités. Le guide complet est `.env.example`.

## Commandes

```bash
npm install                  # postinstall : prisma generate + copy-wasm
npm run dev                  # http://localhost:3000
npm run build                # production
npm start                    # serveur de production
npm run typecheck            # scripts/typecheck.mjs
npm run lint                 # eslint .
npm run format:check         # prettier --check .
npx vitest run               # tests unitaires (410)
npm run test:e2e             # Playwright
npx prisma migrate deploy    # appliquer les migrations en BDD
npx prisma generate          # régénérer le client après changement de schéma
```

**Attention** : après `prisma generate` ou un changement de schéma, **redémarrer le serveur** (le client Prisma est chargé au démarrage).

## Build de production

`npm run build` enchaîne `prisma generate` puis `next build` (Turbopack par défaut). En secours : `npx next build --webpack`.

**Warning documenté (2026-11-27)** : dans l'environnement de développement local (Windows, 10 Go RAM), la phase « Creating an optimized production build » reste bloquée plus de 5 minutes avec Turbopack **et** webpack, sans message d'erreur. Le build n'a donc **pas pu être validé localement** ; à rejouer en CI ou sur une machine disposant de plus de mémoire. Le typecheck, le lint et les 410 tests unitaires passent, ce qui couvre la compilation TypeScript.

Vérifier la section « Build » du journal de session dans `docs/etat/ETAT_COURANT.md`.

## Routage Freerouting 2.6.0

Options CLI utilisées (depuis `src/app/api/pcb/autoroute/freerouting/route.ts`) :

```
-jar <jar> -de <dsn> -do <ses>
--router.autorouter.max_passes <n>
--router.autorouter.ignore_net_classes GND,VCC
--router.copperToEdgeClearanceUm=500
--gui.enabled=false
```

Timeout : 10 minutes. Le score est parsé depuis le stdout et stocké dans `PcbRoutingAttempt`.
