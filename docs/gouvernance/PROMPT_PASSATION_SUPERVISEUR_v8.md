# PROMPT DE PASSATION — Superviseur IA Externe (PartIVA) — v8

**Type :** Addendum à v4+v5+v6+v7 (état V3)
**Date :** 2026-11-06
**Branche :** master
**Statut :** V3-A, V3-B, V3-C closes. V3-D reportée. V2 close.

Ce document complète v4 (règles), v5 (V1.1+V1.2), v6 (V1.3→V1.5), v7 (V2). Toutes les règles v4 restent en vigueur.

## 1. État du projet

- Branche master.
- V2 close : V2-A (mocks), V2-B (FAPI), V2-V2 (UI FAPI), V2-C (cache web).
- V3 close (3/4) : V3-A (<Link> RE), V3-B (exports PDF/STL), V3-C (OpenSERP HTTP). V3-D (step.parts) reportée.
- OpenSERP : conteneur Docker karust/openserp sur localhost:7000, connecteur HTTP /mega/search?engines=bing.

## 2. Zones stables

- src/lib/connectors/fapi.ts
- src/lib/connectors/openserp.ts
- src/lib/connectors/aggregator.ts (cache)
- src/lib/cache/search-cache.ts
- prisma/schema.prisma (WebSearchCache)
- src/components/search-bar.tsx
- src/app/api/search/route.ts (ALL_CONNECTORS : 8 connecteurs)
- src/app/admin/reverse-engineering/reverse-engineering-list-client.tsx
- src/app/admin/pieces/[id]/export-pdf-button.tsx
- src/lib/utils/pdf-export.ts + stl-export.ts
- playwright.config.ts (reuseExistingServer false, timeout 300000)

## 3. Dettes actives consolidées

### Haute
- D-CAMPAIGN-CHECK-AUTH-VALIDITY (Ouverte)
- D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED (Ouverte)
- D-E57-DEEP-MODE-PLAYWRIGHT (Ouverte, 2 tests fixme)

### Moyenne
- D-V2-CACHE-HIT-LATENCY-12S (Ouverte)
- D-ADMIN-TEST-COVERAGE (Ouverte)
- D-WS-REFACTOR (Ouverte)
- D-E24-E2E-TIMEOUT-SOURCES (Active CI)
- D-CAMPAIGN-CHECK-DB-MODULE-RESOLUTION (Ouverte)

### Basse
- D-V3-OPENSERP-GOOGLE-CAPTCHA (Ouverte)
- D-V3-OPENSERP-API-HTTP-MISSING (Résolue partiellement)
- D-V3-STL-EXPORT-NO-CADFILE (Ouverte)
- D-V3-STEP-PARTS-INTEGRATION (Reportée V4)
- D-CI-BYPASS-ADMIN-PUSH (Ouverte)
- D-E2E-WEBSERVER-PORT-LEAK (Ouverte)
- D-AI-HALLUCINATED-INCIDENT-REPORT (Ouverte)
- D-GIT-COMMIT-TYPO (Ouverte)
- D-INFRA-BACKUP-NAMING (Ouverte)
- D-CAMPAGNE-ENCODING (Ouverte)
- D-CAMPAGNE-BUILD-FRESH (Ouverte)
- D-CAMPAGNE-RECORD-ORDER (Ouverte)
- D-CAMPAGNE-CLOUDINARY-CHECK (Ouverte)

## 4. Prochaines phases

### V4-A — Consolidation dettes Haute
- D-CAMPAIGN-CHECK-AUTH-VALIDITY
- D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED
- D-E57-DEEP-MODE-PLAYWRIGHT

### V4-B — Optimisation cache
- D-V2-CACHE-HIT-LATENCY-12S
- D-V3-OPENSERP-GOOGLE-CAPTCHA

### V4-C — Nouvelles features
- V3-D (step.parts)
- Connecteurs TraceParts / TecDoc réels

## 5. Leçons V3

- Leçon 19 : un correctif annoncé sans Get-Content n'est pas un correctif.
- Leçon 20 : prisma migrate dev sans DATABASE_URL forcé migre la prod.
- Leçon 21 : un cookie expiré produit null + candidates 0.
- Leçon 22 : FAPI renvoie analogList.a, pas data.
- Leçon 23 : openserp n'est pas un package NPM. Docker uniquement.
- Leçon 24 : Google, Yandex, Ecosia, DuckDuckGo bloquent OpenSERP. Seul Bing fonctionne.
- Leçon 25 : l'API HTTP OpenSERP est /{engine}/search (ex: /mega/search?engines=bing).

## 6. À l'ouverture de la prochaine session

1. Confirmer la lecture de v4 + v5 + v6 + v7 + v8.
2. Confirmer être prêt à reprendre le rôle de Superviseur.
3. Demander : « Quelle phase souhaites-tu démarrer ? (V4-A dettes Haute, V4-B optimisation, V4-C features, ou autre ?) »
4. Ne produis pas d'analyse statique. Attends la réponse.

La session V3 est close. V3-A/B/C validées. V3-D reportée. Bonne pause.
EOF
filePath: F:\PartIVA\docs\gouvernance\PROMPT_PASSATION_SUPERVISEUR_v8.md