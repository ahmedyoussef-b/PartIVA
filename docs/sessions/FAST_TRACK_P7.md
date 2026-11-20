# FAST-TRACK P7 — Implantation Rapide
**Date :** 2026-11-19
**Statut :** En cours d'initialisation (État des lieux)

## 1. Cartographie initiale
- Dashboard : Structure Poste de Contrôle (P7.1 - UI uniquement)

### T1.1 — Pages admin (src/app/admin/**/page.tsx)
- src/app/admin/3d-test/page.tsx
- src/app/admin/3d-test-iges/page.tsx
- src/app/admin/3d-test-timeout/page.tsx
- src/app/admin/audit/page.tsx
- src/app/admin/dashboard/page.tsx
- src/app/admin/demandes/page.tsx
- src/app/admin/demandes/[id]/page.tsx
- src/app/admin/demandes/[id]/import-cad/page.tsx
- src/app/admin/demandes/[id]/recherche/page.tsx
- src/app/admin/desktop-downloads/page.tsx
- src/app/admin/machines/page.tsx
- src/app/admin/materiaux/page.tsx
- src/app/admin/parametres/page.tsx
- src/app/admin/part-templates/page.tsx
- src/app/admin/part-templates/new/page.tsx
- src/app/admin/part-templates/nouveau/page.tsx
- src/app/admin/part-templates/[id]/page.tsx
- src/app/admin/part-templates/[id]/editer/page.tsx
- src/app/admin/pcb/page.tsx
- src/app/admin/pcb/bibliotheque/page.tsx
- src/app/admin/pcb/nouveau/page.tsx
- src/app/admin/pcb/[projectId]/page.tsx
- src/app/admin/pieces/page.tsx
- src/app/admin/pieces/nouveau/page.tsx
- src/app/admin/pieces/[id]/page.tsx
- src/app/admin/recherche/page.tsx
- src/app/admin/reverse-engineering/page.tsx
- src/app/admin/reverse-engineering/new/page.tsx
- src/app/admin/reverse-engineering/occt-test/page.tsx
- src/app/admin/reverse-engineering/[id]/page.tsx
- src/app/admin/sync/page.tsx
- src/app/admin/usinage/page.tsx

### T1.2 — Composants workspace (src/components/workspace)
AssistantZone.tsx, CandidateCard.tsx, ChatInput.tsx, FileUploadZone.tsx, GlbViewerZone.tsx, IngestZone.tsx, MeasureTool.tsx, MessageList.tsx, OcctCompareTool.tsx, OcctMeasureTool.tsx, OcctSectionTool.tsx, SuggestionList.tsx, ViewerZone.tsx, WorkspaceClient.tsx, WorkspaceLayout.tsx

### T1.2 — Composants pcb (src/components/pcb)
AutoModePanel.tsx, CatalogTable.tsx, CompliancePanel.tsx, DesignReviewPanel.tsx, ExportButtons.tsx, GlbViewer.tsx, KiCadStatus.tsx, PcbPriceCounter.tsx, PcbProjectWorkspace.tsx, PcbProposalDiff.tsx, PcbRollbackDialog.tsx, RequirementForm.tsx, RequirementSummary.tsx, SourcingTable.tsx, VisualComparisonOverlay.tsx

### T2.1 — Modèles Prisma (prisma/schema.prisma)
User, Session, Account, Verification, Part, Vehicle, Fitment, PartCategory, PartImage, PartSpecification, ReverseEngineeringProject, ReverseEngineeringStep, CadFile, Supplier, PartSupplier, Attachment, AuditLog, PartVersion, Request, Machine, Material, SearchCandidate, ScoringWeights, FitReport, SearchHistory, CandidateFeedback, DesktopBuild, DesktopInstaller, WebSearchCache, ReconstructionAttempt, PartTemplate, Solution, PcbProject, PcbRequirement, PcbComponent, PcbPin, PcbNet, PcbProposal, PcbValidation, PcbCheckpoint, PcbVersion, ComponentCatalog, ComponentPrice, RequirementForm, RequirementAnswer

### T2.2 — PcbProject (l.673)
Champs : id, name, description?, status (draft | requirements_validated | design_validated | manufacturing_ready), cadFileUrl?, cadFileName?, createdAt, updatedAt.
Relations : requirements[], components[], nets[], proposals[], validations[], checkpoints[], versions[].
@@map("pcb_projects")

### T2.2 — CadFile (l.235)
Champs : id, projectId?, requestId?, name, url, fileType (FileType), sizeBytes?, createdAt.
Relations : project (ReverseEngineeringProject?), request (Request?).
@@map("cad_files")

### T3.1 — Routes API existantes (src/app/api/**/route.ts)
admin/desktop-downloads, admin/desktop-downloads/[version]/download, ai/chat, audit, auth/[...all], dashboard, dashboard/kpi, desktop/sync/manifest, desktop/sync/pull, desktop-builds, desktop-builds/auto-save, desktop-builds/download, desktop-builds/upload, desktop-builds/[id], desktop-builds/[id]/publish, engine, engine/validate, feedback, fit-reports, health, installers, materials, part-templates, part-templates/[id], parts, parts/[id], parts/[id]/attachments, parts/[id]/attachments/[attachmentId], parts/[id]/completeness, parts/[id]/images, parts/[id]/images/[imageId], parts/[id]/specifications, parts/[id]/specifications/suggestions, parts/[id]/specifications/[specId], parts/[id]/transition, parts/[id]/versions, parts/[id]/versions/diff, pcb/autoroute, pcb/catalog/sync, pcb/checkpoint, pcb/design-review, pcb/design-review/run, pcb/eda, pcb/export/bom, pcb/export/gerber, pcb/ipc, pcb/parse, pcb/propose, pcb/requirements/parse, pcb/rollback, pcb/simulate, pcb/sourcing, pcb/sourcing/engine, plastiques, requests, requests/[id], requests/[id]/attempts, reverse-cao, search, search/facets, search/history, search/photo, search/vehicle, search/vin, sync, upload, upload/cad, upload-installer, upload-url

## 2. Décisions d'implantation
- Données factices en attente de branchement (P7.2)
- P7.2 : `/api/dashboard/kpi` renvoie désormais `totalParts, totalReProjects, totalPcbProjects, pendingRequests, pendingPcbRequirements` (log `[DASHBOARD:KPI] Comptes calculés`). `page.tsx` affiche les compteurs réels (log `[DASHBOARD:UI] Données réelles affichées`).
- Mapping statuts : `pendingRequests` = Request `PENDING` (enum sans `NEW`) ; `pendingPcbRequirements` = PcbRequirement `proposed|to_verify` (status String sans `PENDING|DRAFT`).
- P7.1 : `page.tsx` rendu autonome (Poste de Contrôle) ; `dashboard-client.tsx` devient orphelin → à nettoyer/migrer en P7.3 (sync, machines, file d'attente réelle).
- P7.3 : nouvelle page liste `/admin/pcb/requirements` (placeholder) ; lien "Voir tout" de la carte PCB corrigé → `/admin/pcb/requirements`. Prochaine étape P7.4 : peupler la liste via Prisma.
- P7.4-ter : discriminant `RequestType (PIECE|PCB)` ajouté sur `Request` (default `PIECE`) + enum + `prisma db push` (Neon à jour). API `POST /api/requests` lit `type`. Nouvelle API `GET /api/pcb/requirements` (filtre `type:PCB, status:PENDING`). Page `/admin/pcb/requirements` = tableau ID/Description/Client/Date/Détails.
- **Incohérence à corriger (P7.5 ?)** : le compteur "Cahiers des charges PCB" du Dashboard utilise `pendingPcbRequirements` (modèle interne `PcbRequirement`), alors que la liste `/admin/pcb/requirements` liste les `Request type=PCB`. À aligner.
- Le formulaire client n'envoie pas encore `type:'PCB'` (à faire : P7.5 côté `client/dashboard/creer-piece`).
- P7.5 : compteur Dashboard aligné → `pendingPcbRequirements` = `prisma.request.count({ where:{ type:'PCB', status:'PENDING' } })`. Formulaire client : sélecteur `Type de demande` (PIECE|PCB) + log `[CLIENT:FORM] Type sélectionné` ; `type` ajouté au FormData et persisté via l'action serveur `createRequest` (lecture `input.get('type')`, écrit dans `prisma.request.create.data.type`).
- P7.6 : page `creer-piece` = page de choix (2 cartes Mécanique / PCB, log `[CLIENT:CHOIX]`). Formulaire déplacé vers `creer-piece/mecanique` (type forcé PIECE, sans sélecteur). Nouveau `creer-piece/pcb` (description, fonction, contraintes, fichiers facultatifs, urgence, type=PCB). Action `createRequest` : photos facultatives si PCB (schéma Zod conditionnel `isPcb`).
- P7.7 : page client `client/dashboard/recherche` supprimée ; entrée "Recherche" retirée de `client-sidebar.tsx` (+ import `Search` nettoyé). Aucune autre référence (admin-sidebar `/admin/recherche` conservé).
- P7.8 : `suspectedMaterial` assoupli → `material || undefined` dans `createRequest` (une demande PCB sans matériau n'est plus rejetée par `MaterialSchema`). Formulaire PCB : champ `material` retiré du FormData. Les pièces mécaniques conservent un matériau valide.
- P7.9 : `MappedRequest` expose `type` (mapper). `client/dashboard/demandes` : onglets Toutes / Pièces mécaniques / PCB (log `[CLIENT:DEMANDES] Onglet sélectionné`), colonnes adaptées (PCB : Description du projet + Fonction principale ; Pièce : Machine + Qté + Matière ; Toutes : Description + badge Type). `getRequests` renvoie déjà `type` (pas de select restrictif).
- P7.12 : suppression de l'orphelin `admin/dashboard/dashboard-client.tsx` (0 import après P7.1). Dossier `dashboard/` = `page.tsx` seul. Build vert.
- P7.13 : nouvelle page `/admin/pcb/projets` (composant serveur) — 2 sections : "Projets reçus" (Request type=PCB, PENDING) et "Projets locaux" (PcbProject status draft|in_progress), logs `[PCB:PROJETS]` + `[PCB:PROJETS] ...locaux`. `pcb/page.tsx` (Studio) passe client ; carte "Nouveau projet" → `/admin/pcb/projets` (log `[PCB:STUDIO] Redirection vers la liste des projets`).
- P7.13-bis : Studio `/admin/pcb` = 2 cartes (Concevoir nouvelle carte → `/nouveau` ; cahier des charges client → `/projets`, log `[PCB:STUDIO] Choix du mode de conception`). `nouveau` = client + log `[PCB:NOUVEAU] Création d'un projet vierge`. Ajout `PcbProject.requestId String?` (scalar) + `db push` (Neon à jour). Action serveur `concevoirDepuisDemande` (idempotente : réutilise le PcbProject existant pour la requestId) → bouton "Concevoir" par demande reçue → redirect `/admin/pcb/[projectId]`. Log `[PCB:PROJETS] Lancement de la conception depuis une demande client`.
- Correctif dev : `register-sw.tsx` désenregistre tout SW + vide les caches en dev (résout erreurs HMR/503 Offline dues à un SW résiduel).
- P7.14 : layout admin immersif pour `/admin/pcb/[projectId]` (détection `isPcbWorkspace` dans `admin/layout.tsx` → rendu plein écran sans sidebar/header). Page workspace : `h-screen` flex, barre supérieure avec bouton `WorkspaceBackButton` (Retour → `/admin/pcb/projets`, log `[PCB:WORKSPACE] Retour vers le Studio`), grille `flex-1 overflow-y-auto`.
- P7.15 : workspace = 2 colonnes à défilement indépendant. Parent `flex-1 overflow-hidden` ; colonne gauche Layout PCB `flex-1 overflow-y-auto` ; colonne droite panneaux `xl:w-[400px] overflow-y-auto`. Chaque panneau a sa propre barre de défilement, la page entière ne scrolle plus.
- P7.16 : `components/pcb/PcbCanvas.tsx` — éditeur 2D `<canvas>` (grille 20px, fond navy, clic = ajout d'un rectangle `C{n}` avec log `[PCB:EDITOR] Composant ajouté {x,y}`), redessin via `useEffect` + `ResizeObserver` (DPI géré). Placeholder du Layout PCB remplacé par `<PcbCanvas />`. Éphémère (état local, non persisté).
- P7.18-a : `requirement-input.tsx` (client) — bloc "Exigence" en tête de colonne droite (Input + bouton Valider, entrée = submit), log `[PCB:REQ] Exigence soumise { value }`, champ vidé après validation. Prochaine étape P7.18-b : relier la validation à l'ajout d'un composant dans le canvas.
- P7.18-bis : `PcbCanvas` occupe 100% du panneau gauche — racine `w-full`, wrapper `w-full flex-1`, canvas dimensionné sur `clientWidth/Height` du wrapper (ResizeObserver + DPI). Plus de vide blanc à droite.

## 3. Dettes / Tests reportés

### Dettes techniques (Fast-Track)
- **D-FT-P7-PRISMA-DRIFT** : 2 `db push` appliqués sur Neon (`Request.type`, `PcbProject.requestId`) sans migration Prisma formelle. Régularisation requise avant merge sur main.
- **D-FT-P7-KICAD-IPC-STUB** : `kicad-ipc-adapter.ts` reste un stub (`getKicadProject` → `{name:'mock-project'}`). Aucune action IPC réelle (pas de `place-footprint`).
- **D-FT-P7-CANVAS-NON-PERSISTED** : `PcbCanvas.tsx` = état local, non persisté. Aucun lien Prisma (`PcbComponent`, `PcbNet`).
- **D-FT-P7-HEAD-DIVERGENCE** : HEAD réel `d50f4c0` ≠ prompt v8.12 (`e291ae5`) ≠ ETAT_COURANT (`b193259`). À réconcilier en clôture Fast-Track.

### Tests reportés
- Toutes les sous-étapes P7.0→P7.18-bis : **aucun test E2E, unitaire, ni build** exécuté.
- À couvrir avant merge sur main : `npm run build`, `npm run lint`, `npm run test:e2e`.
- Cf. `D-V8-D-8-E2E-NON-PROUVE` (26/27 specs `e2e/pcb/` sans preuve).

### Étapes abandonnées
- P7.10, P7.11, P7.17 : jamais exécutées (plans).
- P7.18-b : non démarrée (arbitrage IA externe en cours).