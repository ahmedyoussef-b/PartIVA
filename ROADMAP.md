# 🗺️ Feuille de Route Stratégique PartIVA — Vision Superviseur

Document de référence **officiel**. À conserver dans `F:\PartIVA\ROADMAP.md` et à charger par Kilo Code à chaque session.

---

## 🎯 Vision Cible — 1 paragraphe

**PartIVA n'est pas un site de fabrication. C'est une plateforme industrielle de connaissance qui transforme chaque pièce physique en donnée numérique réutilisable.** La boucle `pièce → donnée → connaissance → nouvelle pièce` est l'actif central. Tout ce qui ne sert pas cette boucle est secondaire.

**Position Superviseur** : la vision fournie est excellente et cohérente. Elle devient **la constitution du projet**. Aucune session ne peut la contredire sans validation explicite.

---

## 🖥️ MODE HYBRIDE — Web + Desktop Tauri

PartIVA est une **application hybride** :

- **Mode web** : pages publiques + dashboards admin/client
- **Mode desktop Tauri** : application locale Windows (`.msi` / `.exe`)
- **Page admin de téléchargement** : le dashboard admin doit proposer les installeurs

### Décisions critiques à trancher avant E7-S01

1. **Mode données desktop** : offline-first (SQLite local) ou online-only (API) ?
2. **Auth desktop** : device flow OAuth, token long-lived, ou licence locale ?
3. **Sync desktop ↔ cloud** : comment gérer les conflits ?

### Principe constitutionnel additionnel

- **N°9** : *Le code métier (schémas, validations, logique) doit être partageable entre web et desktop. Aucune logique dupliquée.*
- **N°10** : *Toute fonctionnalité web doit être pensée "desktop-compatible" dès sa conception, même si le desktop arrive en E7.*

---

## 📊 Vue Globale — 9 Étapes, 1 Fondation, 1 Desktop, 1 Finalisation

```
┌──────────────────────────────────────────────────────────────────┐
│  E0 · FONDATION TECHNIQUE           ← PRIORITÉ ABSOLUE           │
│  Rendre l'existant réel : DB, Auth, Sécurité, Qualité            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E1 · MODÈLE MÉTIER & DOSSIER NUMÉRIQUE                          │
│  ID pièce unique, dossier complet, statuts, historique           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E2 · IDENTIFICATION MULTIMODALE & MOTEUR DE RECHERCHE           │
│  Photo/texte/réf/dimensions + score + sources internes           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E3 · SOURCES EXTERNES & PIPELINE INTELLIGENT                    │
│  TraceParts, CADENAS/3Dfindit, catalogues, branchement pipeline  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E4 · ACQUISITION INTELLIGENTE & REVERSE ENGINEERING             │
│  Assistant de mesure, scan 3D, reconstruction CAO                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E5 · INTELLIGENCE & APPRENTISSAGE                               │
│  Similarité géométrique, détection usure, recommandations        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E6 · ÉCOSYSTÈME CLIENT & BIBLIOTHÈQUE ENTREPRISE                │
│  Espace entreprise, machines, versions, commandes, docs          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E7 · DESKTOP TAURI                                               │
│  Application desktop Windows packagée, synchronisée, distribuable │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E8 · FINALISATION, QA & DÉPLOIEMENT PRODUCTION                  │
│  Tests, perf, SEO, monitoring, CI/CD, prod                       │
└──────────────────────────────────────────────────────────────────┘
```

**Total : 9 étapes (E0 → E8)**, chacune découpée en sessions, chaque session en sous-sessions.

---

## 📋 Règle de Découpage

| Niveau | Définition | Durée cible |
|---|---|---|
| **Étape (E)** | Grand bloc thématique livrable | 1 à 4 semaines |
| **Session (S)** | Objectif unique, livrable vérifiable | 1 à 3 jours |
| **Sous-session (S.S)** | Tâche atomique, 1 ordre Kilo | 1 à 4 heures |

**Numérotation officielle** : `E{étape}-S{session}-{sous-session}`
Exemple : `E0-S01-2` = étape 0, session 1, sous-session 2.

---

## 🏗️ E0 — FONDATION TECHNIQUE
**Objectif** : rendre l'existant réel. Sans cette étape, tout le reste est un décor.

**Justification Superviseur** : le rapport d'état des lieux a révélé que la DB est vide, l'auth est un mock, la sécurité est absente, la qualité est non configurée. **Rien ne peut être construit sur du sable.**

| Session | Objectif | Livrable | Priorité |
|---|---|---|---|
| **E0-S01** | Nettoyage infra & sécurisation du repo | `.env` sorti du git, vulns corrigées, `.gitignore` durci | 🔴 Critique |
| **E0-S02** | Setup qualité (ESLint, Prettier, scripts) | `npm run lint` et `npm run format` fonctionnels | 🟠 Haute |
| **E0-S02b** | Décision version Prisma (6 stable vs 7 canary) | Version figée avant schéma | 🔴 Critique |
| **E0-S02c** | Résorption erreurs ESLint | Code applicatif nettoyé (138 erreurs → 0 / 0 warning / 198 fichiers Prettier → 0) | ✅ Terminée |
| **E0-S02-4** | Scripts + validation finale + tailwind plugin | `prettier-plugin-tailwindcss` installé, scripts cohérents, build OK | ✅ Terminée |
| **E0-S03** | Schéma Prisma réel (noyau métier) | User, Part, Request, Material, Machine, Status | 🔴 Critique |
| **E0-S04** | Branchement DB réel (remplacement mocks par Prisma) | `mock-data.ts` supprimé, Server Components/Server Actions/API routes branchés sur Prisma | 🔴 Critique |
| **E0-S05** | Auth réelle (BetterAuth) | Inscription, connexion, session persistante | 🔴 Critique |
| **E0-S06** | Middleware & protection des routes | `/admin/*` et `/client/*` protégés | 🔴 Critique |
| **E0-S07** | Remplacement des mocks par DB réelle | `mock-data.ts` supprimé, tout branche sur Prisma | 🔴 Critique |
| **E0-S08** | Migration Next 14 → 16 | Upgrade Next.js + vérification compatibilité | 🟠 Haute |
| **E0-S09** | Migration Tailwind 3 → 4 | Upgrade Tailwind + adaptation config | 🟡 Moyenne |

**Définition de "E0 terminée"** : l'app démarre, un utilisateur peut s'inscrire, se connecter, créer une pièce, la voir persister en DB, et les zones admin/client sont inaccessibles sans rôle adéquat.

**Durée estimée** : 2-3 semaines de sessions.

---

## 🏗️ E1 — MODÈLE MÉTIER & DOSSIER NUMÉRIQUE
**Objectif** : donner à chaque pièce une identité et un dossier complet.

| Session | Objectif | Livrable |
|---|---|---|
| **E1-S01** | Système d'ID unique pièce | Format `PTV-AAAA-NNNNNN` généré et garanti unique |
| **E1-S02** | Modèle dossier numérique complet | Schéma Prisma étendu : photos, mesures, docs, versions |
| **E1-S03** | Système d'états (workflow pièce) | Réception → Identification → … → Archivée |
| **E1-S04** | Historique & versions | Traçabilité de toutes modifications |
| **E1-S05** | Upload & gestion de fichiers | Photos, PDF, CAO, scans (Cloudinary) |
| **E1-S06** | Interface "Nouvelle pièce" | Formulaire complet de création de dossier |
| **E1-S07** | Vue dossier pièce | Page centrale affichant tout l'historique |

**Définition de "E1 terminée"** : un utilisateur peut créer un dossier pièce complet avec photos, mesures, docs, et suivre son évolution.

**Durée estimée** : 2-3 semaines.

---

## 🏗️ E2 — IDENTIFICATION MULTIMODALE & MOTEUR DE RECHERCHE
**Objectif** : permettre à l'utilisateur de partir de ce qu'il a (photo, texte, réf, dimensions) et d'obtenir un score de correspondance.

| Session | Objectif | Livrable |
|---|---|---|
| **E2-S01** | Recherche interne PartIVA | Moteur interrogeant la BDD pièces |
| **E2-S02** | Recherche par référence | Matching exact/fuzzy sur références |
| **E2-S03** | Recherche par texte | Full-text search (nom, fonction, fabricant) |
| **E2-S04** | Recherche par dimensions | Filtres numériques avec tolérance |
| **E2-S05** | Recherche par photo | Upload + similarité visuelle (à définir : embeddings) |
| **E2-S06** | Système de score multi-critères | Score pondéré (géométrie, dim, matière, fonction) |
| **E2-S07** | Détection des informations manquantes | "Il manque : diamètre int, profondeur, entraxe" |
| **E2-S08** | Assistant de mesure | Formulaire guidé selon infos manquantes |
| **E2-S09** | Interface d'identification | Page unique multi-entrées |

**Définition de "E2 terminée"** : depuis n'importe quelle entrée (photo, texte, réf, dim), l'utilisateur obtient un score et peut enrichir progressivement.

**Durée estimée** : 3-4 semaines.

---

## 🏗️ E3 — SOURCES EXTERNES & PIPELINE INTELLIGENT
**Objectif** : brancher PartIVA sur le monde extérieur et orchestrer le pipeline complet.

| Session | Objectif | Livrable |
|---|---|---|
| **E3-S01** | Intégration TraceParts | Recherche API ou scraping conforme |
| **E3-S02** | Intégration CADENAS / 3Dfindit | Idem |
| **E3-S03** | Catalogues fabricants | Adaptateurs extensibles |
| **E3-S04** | Agrégation multi-sources | Fusion résultats + dédoublonnage |
| **E3-S05** | Pipeline intelligent (3 cas) | Connu / Partiel / Inconnu — routage auto |
| **E3-S06** | Logique de bascule | Le système change de stratégie selon le match |
| **E3-S07** | Interface pipeline | Visualisation du parcours dans l'app |

**Définition de "E3 terminée"** : PartIVA interroge plusieurs sources et route automatiquement vers la bonne stratégie.

**Durée estimée** : 3-4 semaines.

**⚠️ Note Superviseur** : cette étape dépend de **contrats/API externes** — prévoir des sessions de reconnaissance (état des lieux des APIs disponibles) avant implémentation.

---

## 🏗️ E4 — ACQUISITION INTELLIGENTE & REVERSE ENGINEERING
**Objectif** : traiter les pièces inconnues — mesure, scan, reconstruction CAO.

| Session | Objectif | Livrable |
|---|---|---|
| **E4-S01** | Assistant de mesure avancé | Formulaires spécialisés par type de pièce |
| **E4-S02** | Import scan 3D / nuage de points | Upload + visualisation |
| **E4-S03** | Reconstruction CAO | Pipeline scan → mesh → CAO (choix technique à définir) |
| **E4-S04** | Analyse fonctionnelle assistée | Fonction de la pièce + contraintes |
| **E4-S05** | Choix matériau assisté | Recommandation selon usage |
| **E4-S06** | Génération dessin technique | Export PDF/STEP depuis CAO |
| **E4-S07** | Viewer CAO avancé | Améliorer `cad-viewer.tsx` existant |

**Définition de "E4 terminée"** : depuis une pièce inconnue, PartIVA produit une CAO validée et un dessin technique.

**Durée estimée** : 4-6 semaines.

**⚠️ Note Superviseur** : étape **techniquement lourde** (CAO, scan, IA géométrique). Prévoir des sessions de recherche/bench avant implémentation.

---

## 🏗️ E5 — INTELLIGENCE & APPRENTISSAGE
**Objectif** : faire de PartIVA un système qui s'améliore avec l'usage.

| Session | Objectif | Livrable |
|---|---|---|
| **E5-S01** | Similarité géométrique | Matching avancé sur formes |
| **E5-S02** | BDD des problèmes | Casse, usure, déformation, etc. |
| **E5-S03** | Détection d'usure | Analyse photos/scans de pièces usées |
| **E5-S04** | Recommandations proactives | "Cette géométrie + ce matériau = usure fréquente" |
| **E5-S05** | Analyse des historiques | Patterns d'échec, récurrences |
| **E5-S06** | Système de validation humaine | Toutes les validations tracées |
| **E5-S07** | Apprentissage incrémental | Chaque pièce enrichit la BDD |

**Définition de "E5 terminée"** : PartIVA fournit des recommandations basées sur l'historique réel.

**Durée estimée** : 4-6 semaines.

---

## 🏗️ E6 — ÉCOSYSTÈME CLIENT & BIBLIOTHÈQUE ENTREPRISE
**Objectif** : chaque entreprise dispose de son propre référentiel.

| Session | Objectif | Livrable |
|---|---|---|
| **E6-S01** | Espace entreprise (multi-tenant) | Isolation des données par client |
| **E6-S02** | Bibliothèque de pièces | Vue structurée Machines → Pièces → Versions |
| **E6-S03** | Gestion des machines | CRUD machines + liaisons pièces |
| **E6-S04** | Commandes & suivi | Cycle commande complet |
| **E6-S05** | Documents entreprise | Gestion documentaire complète |
| **E6-S06** | Recherche instantanée entreprise | "Guide plastique machine X" → tout |
| **E6-S07** | Réutilisation intelligente | 1ʳᵉ acquisition → 2ᵉ validation → 3ᵉ commande |

**Définition de "E6 terminée"** : une entreprise gère son référentiel numérique complet.

**Durée estimée** : 4-6 semaines.

---

## 🏗️ E7 — DESKTOP TAURI
**Objectif** : livrer PartIVA en application desktop Windows packagée, synchronisée avec le backend web, distribuable via le dashboard admin.

| Session | Objectif | Livrable |
|---|---|---|
| **E7-S01** | Setup Tauri dans le repo | Structure `/src-tauri` + build local |
| **E7-S02** | Stratégie données desktop | Choix SQLite local / API-only / hybride |
| **E7-S03** | Auth desktop | Login sans navigateur (device flow ou clé API) |
| **E7-S04** | Adaptation UI desktop | Layout, raccourcis, menus natifs |
| **E7-S05** | Build & bundling | `.msi` + `.exe` produits en local |
| **E7-S06** | Versioning & release | Système de version + changelog |
| **E7-S07** | Page admin téléchargement | Dashboard `/admin/telechargements` |
| **E7-S08** | CDN / hébergement binaires | Stockage sécurisé + URLs stables |
| **E7-S09** | Auto-update | Mise à jour in-app (Tauri updater) |
| **E7-S10** | Codes signature Windows | Certificat code signing (optionnel mais recommandé) |

**Définition de "E7 terminée"** : un utilisateur peut télécharger `.msi` ou `.exe` depuis le dashboard admin, installer, se connecter, utiliser PartIVA en desktop, et recevoir les mises à jour.

**Durée estimée** : 3-5 semaines.

**⚠️ Note Superviseur** : 3 décisions critiques à trancher avant E7-S01 :
1. **Mode données desktop** : offline-first (SQLite) ou online-only (API) ?
2. **Auth desktop** : device flow OAuth, token long-lived, ou licence locale ?
3. **Sync** : desktop ↔ cloud — comment gérer les conflits ?

Ces décisions seront prises **en E7-S02**, pas maintenant.

---

## 🏗️ E8 — FINALISATION, QA & DÉPLOIEMENT
**Objectif** : rendre PartIVA production-ready.

| Session | Objectif | Livrable |
|---|---|---|
| **E8-S01** | Tests unitaires & intégration | Couverture minimale 60% |
| **E8-S02** | Tests E2E | Playwright sur parcours critiques |
| **E8-S03** | Optimisation performance | Lighthouse > 90 |
| **E8-S04** | SEO & accessibilité | Métadonnées, ARIA, contrastes |
| **E8-S05** | Monitoring & logs | Sentry, logger structuré |
| **E8-S06** | CI/CD | GitHub Actions → Vercel |
| **E8-S07** | Déploiement production | Domaine, SSL, backup, alerting |
| **E8-S08** | CI/CD desktop | Build auto `.msi`/`.exe` sur tag |
| **E8-S09** | Distribution finale | Page admin + liens publics + checksums |

**Définition de "E8 terminée"** : PartIVA est en production, monitorée, testée, déployable automatiquement.

**Durée estimée** : 3-4 semaines.

---

## 📅 Récapitulatif Global

| Étape | Sessions | Durée estimée | Dépendance |
|---|---|---|---|
| **E0** Fondation | 9 | 3-4 sem. | — |
| **E1** Modèle métier | 7 | 2-3 sem. | E0 |
| **E2** Identification | 9 | 3-4 sem. | E1 |
| **E3** Sources externes | 7 | 3-4 sem. | E2 |
| **E4** Acquisition/RE | 7 | 4-6 sem. | E3 |
| **E5** Intelligence | 7 | 4-6 sem. | E4 |
| **E6** Écosystème | 7 | 4-6 sem. | E5 |
| **E7** Desktop Tauri | 10 | 3-5 sem. | E6 |
| **E8** Finalisation | 9 | 3-4 sem. | E7 |
| **TOTAL** | **72 sessions** | **~30-42 sem.** | — |

**Estimation réaliste** : **7 à 11 mois** pour la plateforme complète hybride.

---

## 🧭 Principes Directeurs (constitutionnels)

1. **Aucune UI nouvelle tant que la donnée n'est pas réelle.** (E0 avant tout)
2. **Chaque pièce = un dossier numérique unique et traçable.**
3. **L'IA ne décide jamais seule** — validation humaine obligatoire.
4. **Chaque nouvelle pièce enrichit la BDD** — apprentissage incrémental.
5. **La boucle pièce → donnée → connaissance → pièce est sacrée.**
6. **Aucune intégration externe sans contrat/API identifié.**
7. **Tout ce qui n'est pas tracé n'existe pas** (logs, historique, versions).
8. **Le PCT (Protocole de Coopération Tripartite) régit chaque session.**
9. **Le code métier (schémas, validations, logique) doit être partageable entre web et desktop. Aucune logique dupliquée.**
10. **Toute fonctionnalité web doit être pensée "desktop-compatible" dès sa conception, même si le desktop arrive en E7.**
