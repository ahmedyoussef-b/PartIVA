# PROMPT DE PASSATION â€” Superviseur IA Externe (PartIVA) â€” v9

**Type :** Addendum Ã  v4+v5+v6+v7+v8 (Ã©tat V3+V4-A+V4-B)
**Date :** 2026-11-07
**Branche :** master
**Commit HEAD :** f7a66de
**Statut :** V3 close (3/4). V4-A close (3/3). V4-B close (4/4). V4-C non dÃ©marrÃ©e.

Ce document complÃ¨te v4 (rÃ¨gles), v5 (V1.1+V1.2), v6 (V1.3â†’V1.5), v7 (V2), v8 (V3). Toutes les rÃ¨gles v4 restent en vigueur.

---

## 1. Ã‰tat du projet (au 2026-11-07, fin de V4-B)

- **Branche :** `master`, synchronisÃ© avec `origin/master` (`f7a66de`).
- **V3 close (3/4)** : V3-A (`<Link>` RE), V3-B (exports PDF/STL), V3-C (OpenSERP HTTP). V3-D (step.parts) reportÃ©e.
- **V4-A close (3/3)** : `D-CAMPAIGN-CHECK-AUTH-VALIDITY` rÃ©solue, `D-E57-DEEP-MODE-PLAYWRIGHT` rÃ©solue (4/4 tests Playwright), `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` reclassÃ©e (BloquÃ©e V1.5).
- **V4-B close (4/4)** : `D-V2-CACHE-KEY-COLLISION` rÃ©solue, `D-V2-SEARCH-GET-NO-AGGREGATE` rÃ©solue, `D-V2-CACHE-ENABLED-OPTION` fermÃ©e, `D-V2-CACHE-HIT-LATENCY-12S` reclassÃ©e (Haute / DiagnostiquÃ©e).
- **OpenSERP** : conteneur Docker `karust/openserp` sur `localhost:7000`, connecteur HTTP `/mega/search?engines=bing`. 8 sources, 20 candidats dont 2 rÃ©els.
- **Cache web** : `WebSearchCache` Prisma, `hashCacheKey(query, source, limit)`, `setCache(key, payload, source, limit)`. Routing `GET ?mode=aggregate` ajoutÃ©.

---

## 2. Zones stables V2/V3/V4

- `src/lib/connectors/fapi.ts`
- `src/lib/connectors/openserp.ts`
- `src/lib/connectors/aggregator.ts` (cache, source rÃ©el, limit)
- `src/lib/cache/search-cache.ts` (hashCacheKey 3 args, setCache 5 args)
- `src/lib/cache/search-cache.test.ts` (8 tests)
- `prisma/schema.prisma` (`WebSearchCache`)
- `src/components/search-bar.tsx`
- `src/app/api/search/route.ts` (ALL_CONNECTORS : 8 connecteurs, GET aggregate routing)
- `src/app/admin/reverse-engineering/reverse-engineering-list-client.tsx`
- `src/app/admin/pieces/[id]/export-pdf-button.tsx`
- `src/lib/utils/pdf-export.ts` + `stl-export.ts`
- `playwright.config.ts`
- `scripts/campaign/check-env.ts` (auth runtime validation)
- `scripts/fix-bom.ps1` (nettoyage BOM)
- `.vscode/settings.json` (UTF-8 no BOM)

---

## 3. Dettes actives (consolidÃ©es)

### Haute

| ID | Statut |
|---|---|
| `D-CI-BYPASS-ADMIN-PUSH` | **Ouverte â€” prioritÃ© absolue** (tous les push ont bypassÃ© les CI checks cette session) |
| `D-V2-CACHE-HIT-LATENCY-12S` | Ouverte (Haute, diagnostiquÃ©e) â€” mesure POST HIT Ã  faire en V4-B'' |
| `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` | ReclassÃ©e Moyenne / BloquÃ©e V1.5 |
| `D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE` | Ouverte (V1.5) |
| `D-ADMIN-TEST-COVERAGE` | Ouverte (Moyenne) |

### Moyenne

| ID | Statut |
|---|---|
| `D-ADMIN-TEST-COVERAGE` | Ouverte |
| `D-WS-REFACTOR` | Ouverte |
| `D-E24-E2E-TIMEOUT-SOURCES` | Active (CI) |
| `D-CAMPAIGN-CHECK-DB-MODULE-RESOLUTION` | Ouverte |
| `D-E57-DEEP-MODE-PLAYWRIGHT` | FermÃ©e âœ… |
| `D-WS-HISTORY-UNAUTH-REDIRECT` | Ouverte (Basse, nouvelle) |

### Basse

| ID | Statut |
|---|---|
| `D-V3-OPENSERP-GOOGLE-CAPTCHA` | Ouverte |
| `D-V3-STL-EXPORT-NO-CADFILE` | Ouverte |
| `D-V3-STEP-PARTS-INTEGRATION` | ReportÃ©e V4 |
| `D-CAMPAGNE-ENCODING` | Ouverte (mojibake historique, fix-bom.ps1 crÃ©Ã©) |
| `D-E2E-WEBSERVER-PORT-LEAK` | Ouverte |
| `D-AI-HALLUCINATED-INCIDENT-REPORT` | Ouverte |
| `D-GIT-COMMIT-TYPO` | Ouverte (historique non rÃ©Ã©crit) |
| `D-INFRA-BACKUP-NAMING` | Ouverte |
| `D-CAMPAGNE-ENCODING` | Ouverte |
| `D-CAMPAGNE-BUILD-FRESH` | Ouverte |
| `D-CAMPAGNE-RECORD-ORDER` | Ouverte |
| `D-CAMPAGNE-CLOUDINARY-CHECK` | Ouverte |

---

## 4. Prochaines phases recommandÃ©es

### PrioritÃ© 1 â€” `D-CI-BYPASS-ADMIN-PUSH` (infra, avant toute nouvelle feature)
- Tous les push cette session ont bypassÃ© les 4 required checks.
- VÃ©rifier que la CI est verte rÃ©troactivement (`gh run list`).
- Si non â†’ revert immÃ©diat ou fix.

### PrioritÃ© 2 â€” V1.5 (auth seed)
- `D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE` : rÃ©soudre le seed qui invalide le storageState Playwright.
- DÃ©bloque `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` et `D-ADMIN-TEST-COVERAGE`.

### PrioritÃ© 3 â€” V4-B'' (mesure POST HIT)
- Mesurer HIT rÃ©el avec `$env:ADMIN_PASSWORD` correctement dÃ©fini.
- Fermer `D-V2-CACHE-HIT-LATENCY-12S`.

### PrioritÃ© 4 â€” V4-C (features)
- V3-D (step.parts)
- Connecteurs TraceParts / TecDoc rÃ©els (credentials)

---

## 5. LeÃ§ons V3+V4 (26â†’32)

- **LeÃ§on 26** : `prisma migrate dev` sans `DATABASE_URL` forcÃ© migre la prod.
- **LeÃ§on 27** : un cookie expirÃ© produit `null` + `candidates: 0`. VÃ©rifier `get-session` avant chaque test.
- **LeÃ§on 28** : FAPI renvoie `analogList.a`, pas `data`.
- **LeÃ§on 29** : `openserp` n'est pas un package NPM. Docker uniquement. Google/Yandex/Ecosia/DuckDuckGo bloquent. Seul Bing fonctionne. API HTTP = `/{engine}/search` (ex: `/mega/search?engines=bing`).
- **LeÃ§on 30** : un correctif annoncÃ© sans `Get-Content` n'est pas un correctif (LeÃ§on 19). Le fichier sur disque est le seul juge.
- **LeÃ§on 31** : l'Ã©diteur (Google Antigravity) rÃ©injecte un BOM Ã  chaque sauvegarde. `.vscode/settings.json` ne s'applique pas. Solution : `scripts/fix-bom.ps1` avant chaque commit.
- **LeÃ§on 32** : les rapports Antigravity/Gemini peuvent halluciner (exemple : `OÃ¹ en sommes-nous.txt` propose de refaire V3-C dÃ©jÃ  close). Ne jamais exÃ©cuter sans vÃ©rification.

---

## 6. Ã€ l'ouverture de la prochaine session

1. **Confirmer la lecture de v4 + v5 + v6 + v7 + v8 + v9.**
2. **Confirmer Ãªtre prÃªt Ã  reprendre le rÃ´le de Superviseur.**
3. **Changer le mot de passe admin** (compromis dans cette session).
4. **VÃ©rifier la CI** : `gh run list` â€” si rouge, corriger avant toute nouvelle phase.
5. **Demander :** Â« Quelle phase souhaites-tu dÃ©marrer ? (D-CI-BYPASS-ADMIN-PUSH, V4-B'', V4-C, V1.5, ou autre ?) Â»
6. **Ne produis pas d'analyse statique.** Attends la rÃ©ponse.

**La session V3+V4-A+V4-B est close.** V3-A/B/C validÃ©es. V4-A validÃ©e. V4-B validÃ©e (4/4). Bonne pause. ðŸ–ï¸