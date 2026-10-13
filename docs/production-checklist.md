# Checklist production — PartIVA

**Date :** 2026-10-13
**Auteur :** Superviseur IA
**Statut :** Validé (E8-S05)

---

## 1. Pré-déploiement

### 1.1 Code

- [ ] Tous les commits sont pushés sur `main`
- [ ] Working tree clean
- [ ] Aucune branche non mergée

### 1.2 Qualité

- [ ] `npm run lint` → 0/0
- [ ] `npm run typecheck` → 0 erreur
- [ ] `npm run format:check` → 0
- [ ] `npm run build` → succès
- [ ] `npm run test:e2e` → 100% passed

### 1.3 Base de données

- [ ] Migrations à jour (`npx prisma migrate status`)
- [ ] Schéma valide (`npx prisma validate`)
- [ ] Backup DB récent

### 1.4 Variables d'environnement

- [ ] Toutes les variables obligatoires définies (Vercel)
- [ ] Aucun secret en `NEXT_PUBLIC_`
- [ ] `BETTER_AUTH_URL` = URL de production
- [ ] `DATABASE_URL` = Neon production

### 1.5 Sécurité

- [ ] Audit dépendances (`npm audit`)
- [ ] Aucun secret dans le code
- [ ] HTTPS activé (Vercel par défaut)

---

## 2. Déploiement

- [ ] `vercel --prod` exécuté
- [ ] Build Vercel réussi
- [ ] Déploiement actif

---

## 3. Post-déploiement

### 3.1 Vérifications fonctionnelles

- [ ] `GET /api/health` → 200
- [ ] Page d'accueil accessible
- [ ] Auth (login/logout) fonctionnelle
- [ ] Recherche fonctionnelle
- [ ] Recherche véhicule (`POST /api/search/vehicle`) fonctionnelle
- [ ] Recherche VIN (`POST /api/search/vin`) fonctionnelle

### 3.2 Monitoring

- [ ] Logs Vercel sans erreur
- [ ] Sentry configuré (si applicable)
- [ ] Alertes configurées

### 3.3 Performance

- [ ] Lighthouse ≥ 80 (Performance)
- [ ] Temps de réponse API < 500ms
- [ ] Build size raisonnable

---

## 4. Rollback (si nécessaire)

- [ ] `vercel rollback` exécuté
- [ ] Vérifier la version restaurée
- [ ] Rollback migration si applicable (procédure manuelle)

---

## 5. Dettes bloquantes pour la production

| Dette | Sévérité | Impact | Bloque la prod ? |
|---|---|---|---|
| `D-deploy-comptes` | Moyenne | Vercel/Sentry/domaine non provisionnés | ⚠️ Partiel |
| `D-tecdoc-credentials` | Moyenne | Connecteur TecDoc réel désactivé | ❌ Non (mock) |
| `D-traceparts-credentials` | Moyenne | Connecteur TraceParts réel désactivé | ❌ Non (mock) |
| `D-photo-embedding-backfill` | Moyenne | Embeddings photo désactivés | ❌ Non |

**Verdict :** la production est possible en mode dégradé (mocks). Les credentials activent les fonctionnalités réelles.

---

## 6. Checklist post-production

- [ ] DNS configuré (si domaine)
- [ ] Certificat SSL valide
- [ ] Backup automatique configuré (Neon)
- [ ] Monitoring actif
- [ ] Documentation à jour

---

## 7. Références

- [docs/deployment.md](deployment.md) — Guide de déploiement
- [docs/env-vars.md](env-vars.md) — Variables d'environnement
- [docs/migration-drift.md](migration-drift.md) — Drift migration

---

**Fin de la checklist production — E8-S05.**
