# Audit — synchronisation KiCad, fichier plateau et persistance des composants

**Date :** 2026-11-25
**Périmètre :** tâche 1 du prompt « Audit + Wizard défensif ». Aucun code modifié.

---

## 1. Création du fichier `.kicad_pcb`

- Route unique : `POST /api/pcb/projects/[id]/board` (`src/app/api/pcb/projects/[id]/board/route.ts:148`).
  - `action: 'launch'` (`:160`) : lit `project.kicadFilePath` en BDD (`:156`), calcule le chemin absolu, teste `existsSync`, détecte un `.lck` via `isBoardOpenInKicad` (`:65`, `:168`) et appelle `openBoardInDesktop` (`:69`, `:169`). **Aucune écriture disque, aucune mise à jour BDD.**
  - `action: 'open' | 'reset'` (`:180-189`) : choisit un template, écrit `pcb-work/<id>/carte-test.kicad_pcb` avec `writeFileSync` (`:186`), **met à jour `PcbProject.kicadFilePath` en BDD** (`:188`), puis ouvre KiCad (`:189`). Réponse `{ok, action, kicadFilePath, exists:true}`.
- Appelants : `RequirementInput` (`src/app/admin/pcb/[projectId]/requirement-input.tsx:24`, boutons « Ouvrir un nouveau fichier » / « Reset »), `KicadAutoOpen` (`kicad-auto-open.tsx:17`, `launch` automatique), `PcbCanvas` (`PcbCanvas.tsx:559`, bouton « KiCad » en `source=manual`).
- `RequirementInput` appelle `window.dispatchEvent('pcb:board-refresh')` puis `router.refresh()` (`:32-33`) : le rafraîchissement serveur est donc demandé.
- **Aucun cache applicatif explicite** de `kicadFilePath`. En revanche, la page Layout PCB n'a **pas** `export const dynamic = 'force-dynamic'` (contrairement à la page CDC : `cahier-des-charges/page.tsx:8`), ce qui peut laisser des props serving stale après `router.refresh()` — à confirmer en dev.
- `KicadFileInput` (`kicad-file-input.tsx:17`) initialise son `useState(value)` **une seule fois** depuis la prop `current` : après création du fichier par la route `board`, le champ reste visuellement vide/ancien malgré la BDD à jour. Son indicateur `exists` (`:19`, `:57-60`) n'est mis à jour **que** par le bouton « Enregistrer » (`:37`), pas par la création automatique. C'est la cause la plus probable du « message persiste après création ».

## 2. Synchronisation temps réel

- `GET /api/pcb/board/render` (`src/app/api/pcb/board/render/route.ts`) est la **source d'affichage du canvas** : il lit `kicadFilePath` **en BDD** (`:25`), renvoie 400 « Projet sans fichier KiCad » si absent (`:35`), 400 « Fichier KiCad introuvable » si `existsSync` échoue (`:41`), puis parse le fichier (`:75`).
- Le canvas (`PcbCanvas.tsx:188-211`) recharge à chaque `pcb:board-refresh`. Aucun polling périodique.
- `KiCadStatus` (`src/components/pcb/KiCadStatus.tsx:31-44`) détecte l'IPC **une seule fois au montage** (POST `/api/pcb/ipc`, action `detect`) — pas de surveillance continue.
- Le live sync (`sync_board_live.py`, `kicad-bridge.ts:syncBoardLive`) ne **déplace** que des empreintes déjà présentes dans la mémoire de KiCad ; il ne peut pas ajouter un composant créé sur disque (limite déjà documentée).
- Désaccord possible : fichier présent sur disque mais `kicadFilePath` null en BDD → toutes les routes d'affichage/placement renvoient 400 ; aucun mécanisme ne propose de « réparer ». État actuel observé en BDD : aucun cas `db=null + disk=true` parmi les 6 derniers projets (projets vides = `db=null`, `disk=false`).

## 3. Persistance des composants

- Le sourcing LLM (`POST /api/pcb/requirements/source-components`) **ne crée aucun `PcbComponent`** : il renvoie des propositions et les stocke dans `PcbProject.sourcingCache` (`source-components/route.ts:174`, cache sauvegardé en fin de route).
- La persistance réelle passe uniquement par `POST /api/pcb/components` (`src/app/api/pcb/components/route.ts:84-109`, create/update par référence), appelée depuis le panneau Sourcing :
  - `handlePlaceOne` → `ComponentSourcingPanel.tsx:236` (avant le placement) ;
  - `handlePlaceAll` → `ComponentSourcingPanel.tsx:479` (après le batch).
- `POST /api/pcb/requirements/nets-only` exige des composants **déjà en BDD** (`nets-only/route.ts:146`) et répond 400 « Aucun composant trouvé pour ce projet » (`:152`) sinon. C'est exactement le cas « l'utilisateur clique sur Générer les nets avant d'avoir persisté les composants ».
- Conséquence : l'ordre réel est **sourcing (propositions en cache) → persistance via validation/placement → nets** ; le wizard actuel présente « Netlist » avant « Placement », ce qui est incompatible avec ce flux.

## 4. Synthèse des blocages observés

1. `KicadFileInput` garde un état local périmé après création du fichier (cause directe du message persistant).
2. Pas de `force-dynamic` sur la page Layout PCB →props potentiellement périmées (à confirmer).
3. `nets-only` refuse de générer des nets si les composants ne sont pas persistés, alors que le sourcing ne les persiste pas.
4. Aucun bouton de secours contexts : les messages 400 (« Projet sans fichier KiCad », « Aucun composant ») s'affichent sans action corrective.
5. Aucune réparation automatique si le fichier existe sur disque mais pas en BDD.

**Aucune modification de code n'a été faite dans cette PR.** La tâche 2 (wizard défensif) reste à valider sur la base de ce rapport.
