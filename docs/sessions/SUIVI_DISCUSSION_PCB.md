# Suivi de discussion — Fonctionnalité PCB (PartIVA)

**Document de travail** — ne remplace pas les procédures officielles.
**Créé le** : 2026-11-20
**Statut** : cadrage terminé — 44 étapes validées (V1-V44), 32 questions répondues (Q1-Q32). Fast-Track P7 **CLOS et poussé** (`fast-track/p7-dashboard-pcb`, puis C1+C2 = `398930c` poussé). Post-Fast-Track : A2.5 (saisie `kicadFilePath`), multi-provider LLM avec fallback (Groq → Cerebras → OpenRouter → Google → OpenAI), compilation IA optimisée (6 catégories, complétude 100 %), sourcing composants avec placement par composant dans KiCad. E2E validé techniquement (dry-run + placement réel + vérification 0,01 mm + résolution d'empreintes IA) ; **confirmation visuelle après correctif en attente**.

## 1. Objectif de la discussion

Cadrer, par questions/réponses, la fonctionnalité PCB : l'admin conçoit et implante une carte depuis l'application, KiCad en arrière-plan, carte à gauche et cahier des charges à droite ; puis intégrer l'IA pour lire le cahier des charges et proposer une structure de carte.

## 2. Étapes validées — Partie GAUCHE (carte)

| # | Étape | Statut | Formulation validée |
|---|---|---|---|
| **V1** | Objectif fonctionnel | ✅ | L'admin conçoit/implanète depuis notre app ; KiCad en arrière-plan ; rendu dans notre zone de travail. |
| **V2** | Répartition de l'écran | ✅ | **Gauche** = carte. **Droite** = cahier des charges. |
| **V3** | Double affichage | ✅ | (a) fenêtre KiCad embarquée, (b) vue PartIVA. Bascule par bouton, source unique. |
| **V4** | Mode par défaut | ✅ | **A — vue PartIVA**, KiCad sur demande. |
| **V5** | Périmètre V1 | ✅ | **A — placement seul** (pas de pistes, pas d'autoroutage). |
| **V7** | Règles de placement | ✅ | 8 règles (§2.1). |
| **V8** | Référentiel | ✅ | Origine + dimensions de la carte **obligatoires**. |
| **V9** | Placement au clic | ✅ (reporté) | Pas de clic pour placer ; la position vient de l'algorithme (V23). |
| **V10** | Projet neuf | ✅ | Notre app écrit le fichier de carte minimal, au **format KiCad 10** (version installée 10.0.8), squelette minimal valide (en-tête, couches, outline). |
| **V11** | Démarrage d'un cahier des charges | ✅ | Formulaire de dimensions **éditable** ; création du fichier **automatique**. |
| **V12** | Emplacement du fichier | ✅ | **A — poste admin** (stable), chemin enregistré. |

### 2.1 Règles de placement (V7)

1. Un champ = un composant. 2. Terme inconnu → message, rien n'est placé. 3. Référence auto (`R1`, `R2`…). 4. Position : proposée par l'algorithme puis **corrigeable** par l'admin (V23, ex-« au centre »), convertie en mm. 5. Grille 2,54 mm. 6. Rotation 0°. 7. KiCad fermé → placement en attente, badge « non synchronisé ». 8. Annuler le dernier placement.

---

## 3. Étapes validées — Partie DROITE (cahier des charges)

| # | Étape | Statut | Formulation validée |
|---|---|---|---|
| **V13** | Structure du panneau droit | ✅ | **En haut** : le cahier des charges envoyé par le client, **quel que soit son contenu**, affiché dans une **fenêtre avec défilement**. **En dessous** : la **liste technique des champs et formulaires**, remplis par l'admin en **compilation technique**. |
| **V14** | Lecture du cahier des charges par l'IA | ✅ | L'IA lit le cahier des charges et **propose** : **dimensions**, **liste de composants**, **structure d'implantation** (zones). L'admin **valide ou corrige** ; rien n'est appliqué automatiquement. |
| **V15** | Forme du cahier des charges | ✅ | **Texte obligatoire** (Q12 = A) : le client remplit des champs, ou l'admin colle le texte. Pas d'OCR. |
| **V16** | Formulaire client optimisé | ✅ | Le formulaire envoyé par le client est **restructuré** pour produire un texte directement exploitable par l'IA (blocs alignés sur les catégories existantes `usage / function / processing / mechanical / manufacturing / quality`). |
| **V17** | Bibliothèque de modèles de référence | ✅ | La BDD locale contient des **modèles de cartes prêts** (fonctionnalités + données de carte attachées). L'IA les **consulte** pour répondre de façon plus **concise et ancrée** au lieu d'inventer. |
| **V18** | Corpus de référence | ✅ | Cartes **open source** uniquement, **au format lisible** (KiCad), avec **source + licence** obligatoires. Fiche extraite par le lecteur de carte. Cible de départ : **20 à 50 modèles**. |
| **V19** | Enchaînement | ✅ | Formulaire client → cahier des charges → **analyse IA + corpus** → proposition (dimensions, composants, zones) → validation admin → formulaire de dimensions → création du fichier → placement. *Confirmé par Q16 = C.* |
| **V20** | Déclenchement de l'IA | ✅ | **Automatique une seule fois à la création du projet**, puis **relance manuelle** obligatoire après toute modification (« Relancer l'analyse »). Pas de relance automatique à chaque ouverture. |
| **V21** | Choix des composants dans la bibliothèque | ✅ | Après validation/correction, l'admin **relance l'IA** ; elle **interroge la bibliothèque complète de composants** et affiche **dynamiquement** une **liste de champs rétractables** — un champ par composant, contenant **plusieurs modèles** de ce même composant. L'admin **sélectionne et valide** modèle par modèle. |
| **V22** | Placement réel depuis les coordonnées | ✅ | Pour **chaque champ validé**, l'algorithme calcule les **coordonnées** de la pièce et les **envoie à KiCad**, qui la place sur la carte. |
| **V23** | Position proposée et corrigeable | ✅ | L'algorithme **propose** une position (répartition par zones, grille 2,54 mm). L'admin peut **la corriger** avant l'envoi à KiCad, par **saisie numérique (X/Y)** et par **glisser-déposer** sur la vue (Q32 = les deux). *Remplace la règle V7.4 « au centre » (Q18 = C).* |
| **V24** | Emplacement du corpus et de la bibliothèque | ✅ | **SQLite sur le poste admin** (Q19 = B) — cohérent avec le fichier de carte (V12). Pas de double source de vérité. |
| **V25** | Architecture réelle de l'application | ✅ | Application **hybride** : **Tauri 2** (`desktop/src-tauri`) embarque un **serveur Next.js en sidecar** (`127.0.0.1`) + une **BDD SQLite locale** (`%APPDATA%\PartIVA\partiva.db`) synchronisée depuis le cloud, et **PostgreSQL** côté serveur. **Conséquence : V12 et V24 tiennent** — les routes API du PCB s'exécutent sur le poste admin, donc elles peuvent écrire les fichiers et joindre KiCad. |
| **V26** | Pas de fonctionnement hors ligne | ✅ | Le module PCB **exige le réseau** (Q21) : l'IA est indispensable à la chaîne. Le SQLite local (V24) reste un **stockage**, pas un mode hors ligne. |
| **V27** | Modèle LLM | ✅ | **Groq** (déjà configuré, `GROQ_API_KEY`), modèle **`openai/gpt-oss-120b` (via `GROQ_MODEL`)** (Q22 = B), avec **sortie JSON stricte** à schéma fixe. *(Mis à jour en B.1 : initialement `llama-3.3-70b-versatile`.)* |
| **V28** | Nombre d'alternatives affichées | ✅ | **Seuil de compatibilité** (Q23 = C) : tout ce qui dépasse un score (ex. 80 %), avec **minimum 3** et **maximum 8** modèles par champ, plus un lien « voir tout ». |
| **V29** | Emplacement du pont KiCad | ✅ | **Serveur Node / sidecar** (Q24 = B) : réutilise `/api/pcb/ipc` et `kicad-ipc-adapter.ts`. Aucun code KiCad en Rust. |
| **V36** | Capitalisation | ✅ | **Chaque projet accompli** est sauvegardé dans la BDD locale (fiche : cahier des charges, proposition validée, composants retenus, positions, fichier). Deux régimes légaux : **modèles de référence** (open source, licence) et **projets accomplis** (internes, sans licence). Les deux alimentent la recherche ultérieure. |
| **V37** | Recherche dans la bibliothèque | ✅ | **Hybride** (Q25 = B) : **filtres structurés** (les 6 blocs) pour restreindre, puis **similarité** sur les champs textuels pour classer ; chaque résultat montre **pourquoi** il matche. L'IA ne **réordonne** que le top-5, elle ne crée jamais de ligne. SQLite suffit (cosinus en code ou `sqlite-vec`). |
| **V38** | Catalogue / stock de composants | ✅ | **Structure liée à la BDD locale** qui **audite et répertorie** les composants électroniques disponibles en stock, et intègre **toutes les données liées** à chaque composant exploité dans le PCB (empreinte, paramètres électriques, prix unitaire, stock, fournisseur, datasheet). **Stock réel avec avertissement seulement** (pas de blocage) (Q26 = B). **Un seul fournisseur par composant** (Q27 = C) — prix unique. Schéma par défaut : voir §3.1 (V41). |
| **V39** | Compteur de prix | ✅ | À chaque composant **placé/validé** par l'IA, son prix unitaire **s'incrémente** ; affichage du **coût total de la carte** (composants) en fin de chaîne. |
| **V40** | BDD vectorielle locale | ✅ | **Implantation d'une BDD vectorielle dans la BDD locale** (SQLite + `sqlite-vec`), synchronisée avec le corpus et le catalogue, pour alimenter la recherche hybride (V37) sans service externe. |
| **V41** | Schéma par défaut du catalogue | ✅ | Schéma par défaut de la table `components` (§3.1), défini pour débloquer la migration. |
| **V42** | Format de fichier de carte | ✅ | **Version optimale** : KiCad 10 (10.0.8), squelette minimal valide (en-tête, couches, outline), vérifié par ouverture dans KiCad. |
| **V43** | Remplissage du formulaire 6 blocs | ✅ | Le **client** remplit les 6 blocs dans **son profil**, puis **envoie à l'admin** (crée/met à jour la `Request`). |
| **V44** | Correction de position | ✅ | L'admin corrige la position proposée par **saisie numérique (X/Y)** et par **glisser-déposer** sur la vue (les deux). |
| **V45** | Schéma Prisma régularisé | ✅ | **A3-α** : dérive Fast-Track régularisée (`RequestType`, `PcbProject.requestId`) via `migrate diff` + `resolve --applied` (non destructif). Nouveau champ `PcbProject.kicadFilePath String?` (V12). Mitigations R8 (`--config prisma.config.ts`) et R9 (UTF-8 sans BOM). |
| **V46** | Corpus + recherche FTS5 | ✅ | **A7.1 + FTS5** : composants réels (`ComponentCatalog` web → SQLite local), sync incluse (`SYNC_TABLES` + `upsert_components`), recherche FTS5 (BM25 + stemming) via migration `0008_components_fts.sql`. Vectoriel (V37) différé (API externe, hors Fast-Track). |
| **V47** | Recherche FTS5 côté Rust | ✅ | `components.rs` : `search_components` (FTS5 + repli LIKE), `search_components_fts`, `search_components_like`, `escape_fts5_query`. Commande Tauri `search_components` exposée. Index vide → repli LIKE. |
| **V48** | Sécurisation des routes PCB | ✅ | `requireAdmin()` ajouté sur les 17 routes `/api/pcb/*` non protégées (A8). Authentification harmonisée (pattern `parts/route.ts`). Dette `D-FT-P7-PCB-AUTH-GAP` soldée. |
| **V49** | Analyse du cahier des charges client (Phase B) | ✅ | LLM unifié `callGroq` (`openai/gpt-oss-120b` via `GROQ_MODEL`), `responseFormat: json_object`, validation Zod (`PcbRequirementSchema`). `POST /api/pcb/analyze` : texte CDC → exigences structurées (dimensions, composants, zones) + bouton « Analyser » dans `cahier-des-charges`. `GET /api/pcb/catalog/search` (top-10) injecté comme candidats dans le prompt. `POST /api/pcb/propose` persiste les propositions (`PcbProposal`, `pending`) quand `projectId` est fourni. `PATCH /api/pcb/proposals/[id]` : `accepted`/`rejected` + `resolvedAt` ; si `add_component` accepté → création du `PcbComponent` (`status: proposed`). UI `ProposalsPanel` (colonne droite) : Accepter / Rejeter. |

## 4. Questions ouvertes

| # | Question | État |
|---|---|---|
| **Q1-Q8** | Cadrage carte, écran, placement, fichier | ✅ Répondues (voir V1-V12) |
| **Q9** | Bibliothèque de composants de la V1 | ✅ Répondu par **V21** — une entrée par composant, **plusieurs modèles** par entrée, listes rétractables. |
| **Q10** | Anti-empilement des placements | ✅ Répondu par **V23** — garanti par l'algorithme de positionnement. |
| **Q11** | Sous quelle **forme** arrive le cahier des charges client (texte, PDF, Word, photo/scan, mélange) ? | ✅ Répondu par **V15/V16** — texte obligatoire, formulaire en 6 blocs. |
| **Q12** | L'IA ne peut lire que du **texte** : exiger du texte / OCR / saisie manuelle assistée ? | ✅ Répondu — **A** : texte obligatoire (client ou admin). Pas d'OCR. |
| **Q13** | Contenu exact du formulaire client optimisé : garde-t-on les 6 blocs proposés, en ajoute-t-on, en retire-t-on ? | ✅ Répondu — **les 6 blocs sont validés**. |
| **Q14** | D'où viennent les **modèles de référence** (le corpus) : projets déjà réalisés, saisie manuelle, catalogues externes ? | ✅ Répondu — **C** (open source / designs de référence). |
| **Q15** | Critère d'admission dans le corpus : uniquement les cartes dont on peut **lire le fichier**, ou aussi les fiches partielles ? | ✅ Répondu — **A** : fichiers lisibles uniquement. |
| **Q16** | Quand l'IA analyse-t-elle : automatiquement à l'ouverture, sur demande (bouton), ou les deux ? | ✅ Répondu — **C** : auto à la création + relance manuelle obligatoire après modification. |
| **Q17** | Comment l'admin valide-t-il la proposition de l'IA : tout d'un coup, par bloc, ou élément par élément ? | ✅ Confirmé — **par bloc**, puis **sélection ligne par ligne** des composants (V21). |
| **Q18** | Où sont placées les pièces : **au centre** (règle V7.4) ou **aux coordonnées calculées** par l'algorithme (V22) ? | ✅ Répondu — **C** : position proposée, corrigeable avant l'envoi (V23). |
| **Q19** | Où vit le **corpus + la bibliothèque de composants** : base **Postgres/Neon** (serveur) ou **SQLite desktop** (poste admin) ? | ✅ Répondu — **B** : SQLite sur le poste admin (V24). |
| **Q20** | L'application tourne-t-elle **sur le poste admin** (localhost) ou sur un **serveur** ? Conditionne V12 (fichier local) et V24 (SQLite local). | ✅ Répondu — **hybride** : Tauri + sidecar Next local + SQLite local, PostgreSQL côté serveur (V25). |
| **Q21** | Le module PCB doit-il fonctionner **hors ligne** ? Le code actuel exige PostgreSQL pour le PCB et l'IA. | ✅ Répondu — **non** : le PCB dépend de l'IA, donc du réseau (V26). |
| **Q22** | Quel **modèle LLM** pour l'analyse du cahier des charges et le choix des composants ? Le modèle actuel est `llama-3.1-8b-instant`. | ✅ Répondu — **B** : Groq, `llama-3.3-70b-versatile`, sortie JSON stricte (V27). |
| **Q23** | Combien de **modèles par composant** dans chaque champ rétractable : tous les compatibles, les 3 meilleurs, ou un seuil de score ? | ✅ Répondu — **C** : seuil de score, 3 à 8 modèles (V28). |
| **Q24** | Le **pont KiCad** s'écrit-il côté **Rust (Tauri)** ou côté **serveur Node (sidecar)** ? | ✅ Répondu — **B** : Node/sidecar (V29). |
| **Q25** | Comment la **recherche dans la bibliothèque** doit-elle se faire pour donner des résultats **valides** ? | ✅ Répondu — **B** : hybride, filtres + similarité, IA en réordonnancement uniquement (V37). |
| **Q26** | Le catalogue de composants est-il un **vrai stock** (décrément à chaque placement) ou seulement un **référentiel de prix** ? Et **multi-fournisseur** par composant ? | ✅ Répondu — **B** : vrai stock, avertissement seulement, pas de blocage (V38). |
| **Q27** | **Multi-fournisseur** par composant : on garde le **fournisseur préféré** (prix affiché) avec possibilité de choisir un autre, ou on affiche le **moins cher** automatiquement ? | ✅ Répondu — **C** : prix unique, un seul fournisseur par composant (V38). |
| **Q28** | Source des embeddings pour V37 | ✅ Répondu — **BDD vectorielle locale** (sqlite-vec) + synchronisation (V40). |
| **Q29** | Schéma du catalogue (V38) | ✅ Répondu — **défini par défaut** (§10 / V41). |
| **Q30** | Format minimal du fichier de carte (V10) | ✅ Répondu — **version optimale** : KiCad 10 (V42). |
| **Q31** | Qui remplit le formulaire client 6 blocs | ✅ Répondu — **le client dans son profil**, puis envoie à l'admin (V43). |
| **Q32** | UX de correction de position (V23) | ✅ Répondu — **les deux** : saisie numérique + glisser-déposer (V44). |
| **Q33** | Schéma Prisma (A3) | ✅ Répondu — **A3-α** + champ `kicadFilePath String?` (V45). Mitigations R8/R9. |
| **Q34** | Corpus + recherche (A7) | ✅ Répondu — **A7.1 + FTS5** : composants réels, sync incluse, recherche BM25. Vectoriel différé (V37). |
| **Q35** | Recherche FTS5 (A7.1-c) | ✅ Répondu — Rust FTS5 + repli LIKE, commande Tauri `search_components`. Index vide → LIKE. |

---

## 5. Contraintes techniques retenues

- Fenêtre KiCad embarquée = **desktop uniquement**, dépendante de la version.
- Vue PartIVA = disponible partout, repli permanent.
- Connexion IPC KiCad 10.0.8 **prouvée** ; placement réel **non implémenté**.
- KiCad doit être **ouvert avec un PCB** ; pas besoin d'être au premier plan.
- Lecture de la carte (origine, dimensions, composants) = prérequis obligatoire.
- Poste admin **stable** → pas de synchronisation multi-postes.
- Routes `/api/pcb/**` **sans authentification** (à traiter avant d'exposer le placement).
- Routage automatique **impossible via IPC** (hors V1).

---

## 5.1 Innovations de fiabilité (V30-V35, ✅ validées)

Objectif : rendre la chaîne **formulaire client → carte prête à envoyer** fiable, c'est-à-dire **vérifiable** à chaque étape, et non « l'IA a dit ».

| # | Innovation | Étape | Problème qu'elle supprime |
|---|---|---|---|
| **V30** | **Complétude + contradictions** avant envoi du formulaire : score de complétude, blocage si une contradiction est détectée (ex. alimentation 3,3 V et actionneur 12 V). | Formulaire client | Un formulaire creux ou incohérent, que l'IA comblera en inventant. |
| **V31** | **Provenance obligatoire** : chaque valeur proposée cite sa **source** — la phrase du client ou l'**identifiant du modèle** du corpus. Sans source, la valeur est rejetée. | Analyse IA | Les valeurs inventées, indétectables aujourd'hui. |
| **V32** | **Double passe + détection de divergence** : l'IA est interrogée deux fois, seules les valeurs **stables** sont retenues ; les écarts sont signalés à l'admin. | Analyse IA | L'aléa du modèle sur les dimensions et les composants. |
| **V33** | **Vérification déterministe des composants** : règles (pas IA) sur tension, courant, nombre de broches, découplage ; **empreinte validée** par modèle de la bibliothèque. | Choix des composants | Une sélection plausible mais électriquement fausse. |
| **V34** | **Envoi sûr à KiCad** : contrôle géométrique avant envoi (chevauchement, hors carte, zones, dégagement) + **transaction idempotente** + **dry-run** (diff annoncé) + **réconciliation** entre l'état de l'app et le fichier réel. | Placement / KiCad | Les placements à moitié appliqués et les désynchronisations. |
| **V35** | **Jeu d'évaluation de référence** : 10 cahiers des charges types → proposition attendue, rejoués à chaque changement de prompt ou de modèle, avec score (erreur de dimension, rappel des composants, validité du placement). | Tout | L'absence de mesure : on ne sait pas si une modification dégrade la qualité. |

> Sans **V35**, les cinq autres sont des intentions. C'est la seule qui prouve que la fiabilité progresse.

---

## 6. Points à porter plus tard dans les registres officiels

- Source de vérité des données de carte (décision `(ae)` à réviser ?).
- One-shot vs daemon persistant.
- Champ `.kicad_pcb` sur `PcbProject` (migration Prisma).
- Sécurisation des routes PCB. Dégradation web. Sort de `FAST_TRACK_P7.md`.

---

## 7. Journal

| Date | Événement |
|---|---|
| 2026-11-20 | Ouverture. V1, V2 validés. Q3 posée. |
| 2026-11-20 | Q3 = A → V4. Q4 posée. |
| 2026-11-20 | Q4 = A (placement seul) → V5. Q5 posée. |
| 2026-11-20 | Q5 = oui → V6. V7 proposé. Q6 posée. |
| 2026-11-20 | Q6 = pas de clic → V8, V9. Q7 posée. |
| 2026-11-20 | Q7 = C → V10. Q8 posée. |
| 2026-11-20 | Q8 = A + formulaire de dimensions → V11, V12. Q9 posée. |
| 2026-11-20 | **Partie gauche suspendue** (Q9, Q10 en attente). Passage à la partie droite : V13 validé. Q11 posée. |
| 2026-11-20 | **Exécution** (voir §8) : champ « Exigence » → « Cahier des charges », bouton « Valider » → « Consulter », placement supprimé, page de consultation créée. |
| 2026-11-20 | Champ pré-rempli avec la **Fonction principale** du client (`Request.partFunction`), placeholder si absente. |
| 2026-11-20 | Ouverture de la piste **IA** : lecture du cahier des charges → proposition de structure (V14, 🟡). Q11 et Q12 ouvertes. |
| 2026-11-20 | Q12 = A. V14, V15, V16 validés : texte obligatoire, formulaire client restructuré en 6 blocs. Q13 posée. |
| 2026-11-20 | Q13 validé (6 blocs). Piste **corpus/RAG** ouverte. Q14 posée. |
| 2026-11-20 | Q14 = C, Q15 = A → V17, V18 : corpus open source, fichiers lisibles, source + licence, 20-50 modèles. Q16 posée. |
| 2026-11-20 | Q16 = C → V19, V20 : auto une fois à la création, relance manuelle après modification. Q17 posée. |
| 2026-11-20 | Précision du chaînage → **V21** (bibliothèque de composants, listes rétractables de modèles, sélection validée) et **V22** (coordonnées → KiCad). **Q9 répondue**. Q18 ouverte (centre vs coordonnées calculées). |
| 2026-11-20 | Q18 = C → **V23** : position proposée puis corrigeable. Règle V7.4 mise à jour. Q19 posée (emplacement du corpus). |
| 2026-11-20 | Q19 = B → **V24** : corpus + bibliothèque en SQLite local. Q20 posée (l'app tourne-t-elle sur le poste admin ?). |
| 2026-11-20 | Q20 = **hybride** → **V25** : Tauri 2 + sidecar Next local + SQLite local + PostgreSQL serveur. V12 et V24 confirmées. Q21 posée (hors ligne ?). |
| 2026-11-20 | Q21 = non → **V26** : PCB en ligne uniquement (l'IA est indispensable). Q22 posée (choix du modèle LLM). |
| 2026-11-20 | Q22 = B → **V27** : Groq `openai/gpt-oss-120b` (via `GROQ_MODEL` ; maj B.1, initialement `llama-3.3-70b-versatile`), JSON strict. Q23 posée (nombre d'alternatives par composant). |
| 2026-11-20 | Q23 = C → **V28** : seuil de score, 3 à 8 modèles par champ. **Q10 et Q11 clôturées.** Q24 posée (emplacement du pont KiCad). |
| 2026-11-20 | Q24 = B → **V29** : pont KiCad côté Node/sidecar. Proposition de **6 innovations de fiabilité** V30-V35 (§5.1), à arbitrer. |
| 2026-11-20 | V30-V35 validées. **V36** : capitalisation — projets accomplis dans la BDD locale, deux régimes légaux. Q25 posée (recherche intelligente). |
| 2026-11-20 | Q25 = B → **V37** : recherche hybride (filtres + similarité), IA en réordonnancement. **Q17 reste à confirmer** (implicite : par bloc + sélection ligne par ligne). |
| 2026-11-20 | **Q17 confirmé.** Cadrage complet. 37 étapes validées (V1-V37), 25 questions répondues (Q1-Q25). |
| 2026-11-20 | Nouveau besoin : **catalogue/stock de composants + compteur de prix** → V38, V39 proposés. Q26 posée. |
| 2026-11-20 | Q26 = B → **V38, V39 validées** : vrai stock avec avertissement, compteur de prix. Q27 posée (multi-fournisseur). |
| 2026-11-20 | Q27 = C → **V38 précisée** : prix unique, un seul fournisseur par composant. Cadrage complet : 39 étapes (V1-V39), 27 questions (Q1-Q27). |
| 2026-11-20 | **Re-analyse (failles)** : 6 bloquants levés par le coordinateur — V6 supprimé, V40 (BDD vectorielle), V41 (schéma par défaut), V42 (format KiCad 10), V43 (formulaire client), V44 (correction les deux). V9 mis à jour. Q28-Q32 répondues. Cadrage : 44 étapes (V1-V44), 32 questions (Q1-Q32). |
| 2026-11-20 | A2 validé : migration `0007_add_component.sql` + test db.rs + README. A3-α + champ `kicadFilePath` validés (R8/R9 mitigés). Prompt A3 émis. |
| 2026-11-20 | A7 validé : **A7.1 + FTS5** (composants réels, sync incluse, recherche BM25). Vectoriel différé (V37). Prompt A7.1-a émis. |
| 2026-11-20 | **Phase B close** : B.1 (LLM 120b + JSON strict + Zod), B.2.1/B.2.2/B.2.3 (schéma, `POST /api/pcb/analyze`, bouton Analyser), B.3.1/B.3.2 (recherche catalogue + injection candidats), B.4.1/B.4.2/B.4.3 (persistance `PcbProposal`, PATCH accept/reject, `ProposalsPanel`). Commits `d0029f4`, `7d4ce2d`, `ada4ac3` + `3176384` (style). |
| 2026-11-20 | **Phase C — Placement** : C.1 `src/lib/pcb/placement.ts` (pur, 16 tests) — `pxToMm` (calibration largeur plateau / largeur canvas), `snapToGrid` 2,54 mm, `generateReference`, `clampToBoard`, `computePlacement`. C.2 `PlacementPanel` (`<details>`, `usePcbEditor()`, dimensions via `parseKicadPcb`, repli 100×80 mm, édition inline). C.3.1 `POST /api/pcb/components` (findFirst + create/update, 11 tests). C.3.2a `scripts/kicad/place_footprints.py` (batch transactionnel : 1 `LoadBoard`, 1 `SaveBoard`, échec = aucune écriture) + `placeFootprints()` (bridge 15 tests). C.3.2b `POST /api/pcb/place/batch` (borne 200, 12 tests). C.3.2c bouton « Placer dans KiCad » (dry-run par défaut → persistance → batch → récap). Commits `c5fb052`, `94a1873`, `5d10585`, `c7b83b4`. |

---

## 8. Actions exécutées (hors discussion)

**Écart documenté (charte §11) :** l'IA externe ne modifie pas de fichiers (`PROCEDURE_IA_EXTERNE` §4). Le coordinateur a **explicitement autorisé** cette modification ponctuelle. Elle est tracée ici, non commitée.

| Élément | Détail |
|---|---|
| `requirement-input.tsx` | Titre « Cahier des charges » ; champ `Input` inerte (placeholder seul, `readOnly`) ; bouton « Consulter » (lien) ; **suppression** de `resolveComponentFromText` / `addNodeAtCenter` et de l'état local. |
| `cahier-des-charges/page.tsx` (nouveau) | Page de consultation : demande client (description, fonction, matériau, quantité, urgence, statut, client, date), fichiers transmis (CAO + photos), compilation technique (`PcbRequirement` groupés par catégorie). |
| `page.tsx` (workspace) | `<RequirementInput projectId={projectId} partFunction={…} />` ; lecture de `Request.partFunction` via `project.requestId`. |
| `requirement-input.tsx` (complément) | Le champ affiche la **Fonction principale** du client (`Request.partFunction`) ; si elle est absente, le champ reste vide et le **placeholder** s'affiche. |
| Preuves | `npm run typecheck` → **EXIT 0** ; `prettier` → **OK** sur les 2 fichiers modifiés. |
| État | **Non commité.** |

**Constat annexe (bloquant CI) :** `prettier --check` échoue sur **9 fichiers** de `src/app/admin/pcb/`, dont des fichiers non touchés ici. Cause identifiée : absence de **saut de ligne final** (le formateur ne change rien d'autre). À corriger avant la PR (R3).

---

## 9. Plan d'exécution ordonné (proposé)

**Phase A — Fondations** ✅ *faite et commitée (A1→A8)*
1. Hygiène CI : ✅ `prettier` sur 7 fichiers (A1) + 7 fichiers Phase B (commit `3176384`).
2. Schéma : ✅ `0007_add_component.sql` (A2), `kicadFilePath` + régularisation dérive (A3).
3. Lecteur `.kicad_pcb` : ✅ `kicad-file-reader.ts` (A4).
4. Pont KiCad Node : ✅ `kicad-bridge.ts` + `POST /api/pcb/place` (A6).
5. BDD vectorielle locale : ⏭️ **différée** (sqlite-vec = A7.3, hors Fast-Track) — FTS5 réalisé à la place (A7.1/A7.2).

**Phase B — Partie droite (cahier des charges + IA)** ✅ *faite et commitée (B.1→B.4)*
6. Client LLM : ✅ `openai/gpt-oss-120b` + JSON strict + Zod (B.1).
7. Analyse CDC : ✅ `POST /api/pcb/analyze` (B.2.1/B.2.2) + bouton Analyser (B.2.3).
8. Corpus + recherche : ✅ `GET /api/pcb/catalog/search` + injection candidats (B.3.1/B.3.2).
9. Proposition validable : ✅ `PcbProposal` persisté + PATCH accept/reject + `ProposalsPanel` (B.4.1/B.4.2/B.4.3).

**Phase C — Partie gauche (placement)** ✅ *faite et commitée (C.1→C.3.2c)*
10. Algorithme de positionnement : ✅ `placement.ts` (px→mm, grille 2,54, références, clamp) (C.1).
11. UI : ✅ `PlacementPanel` (`<details>`, édition inline X/Y/rotation) (C.2).
12. Envoi KiCad : ✅ `POST /api/pcb/place/batch` (batch transactionnel, 1 `SaveBoard`) + bouton « Placer dans KiCad » (C.3.2b/c).

**Phase D — Fiabilité & capitalisation** ✅ *faite et commitée*

13. ✅ **V33 — Vérification déterministe** : `verify-placement.ts` (pur, tolérances 0,01 mm / 0,5°) + `POST /api/pcb/place/verify` (relecture `parseKicadPcb` du disque) + verdict « N/N conformes » dans `PlacementPanel` — **29 tests**.
14. ✅ **V34 — Envoi sûr** : scripts Python durcis (**verrou `.lck`**, contrôle bbox `Edge.Cuts`, **backup `.bak`**, **réconciliation avec restauration**), flags `--force` / `--allow-outside`, `parseResult` du bridge corrigé (rétrocompatible, `placed`→`footprintCount`), routes `place` + `place/batch` enrichies (`verified`/`backup`) — **47 tests**.
15. ✅ **V35 — Golden set** : `golden-set/` (10 CDC réalistes, scorer **0.3 / 0.4 / 0.3**, orchestrateur séquentiel avec **isolation des échecs**) — **20 tests, 0 réseau**.
16. ✅ **V39 — Compteur de prix** : `price-total.ts` (pur) + `PriceCard` + `POST`/`GET /api/pcb/catalog/price` (le **404 de `CatalogTable` est corrigé** : il s'agissait d'une **écriture** de prix, pas d'une lecture).
17. ✅ **V36 — Capitalisation** : `capitalize.ts` (fiche `accomplished` validée Zod, stockée dans `PcbCheckpoint` label `accomplished`, **idempotente**, **aucune migration**) + `POST /api/pcb/capitalize` + `CapitalizeButton` — régimes `internal` / `reference` (+ licence).

**Phase E — Qualité de l'analyse** ✅ *faite et commitée*

18. ✅ **V31 — Provenance** : colonne `source String?` sur `PcbRequirement` (migration `20261121093328`, **1 `ALTER TABLE ADD COLUMN`**) + `analyze-mapping.ts` (pur, 10 tests) + prompt exigeant une **citation exacte**, `inféré` ou `catalog:<id>` ; **source absente → `status: to_verify`** ; UI « Source : … » + badge « à vérifier ».
19. ✅ **V30 — Complétude + contradictions** : `cdc-quality.ts` (pur, 14 tests) — complétude **/6**, conflits d'unités (V/mV/kV, A/mA/µA, W/mW, Ω/kΩ/MΩ, mm/cm/m ; **écart > 5 %** ou **familles différentes**), `unsourced`, `toVerify`. Exposé dans la réponse API + panneau **« Qualité du CDC »**. **DÉCISION V30.3 : avertir seulement, ne pas bloquer** (faux positifs possibles sur des rails multiples) — blocage à reconsidérer après mesure sur le golden set.
10. ✅ **V32 — Double passe** : `consensus.ts` (pur, 12 tests) — `mergePasses`, valeurs **stables**, divergences, `onlyInPass1/2`. **Double passe active par défaut** (2 appels LLM **séquentiels**), dégradation `failed` si la seconde échoue.
11. ✅ **V37 — Réordonnancement** : `rank-candidates.ts` (pur, 11 tests) + classement IA du **top-10 → top-5**, conditionné à `rankCandidates && doublePass && candidates.length > 5`. Dégradation `fallback` (jamais de 502).

**PLAN FAST-TRACK P7 — CLOS** (Phases A → E).

**Reste hors périmètre** : recherche vectorielle (Cloudflare `bge-small` / HF), runner live du golden set, mesure des faux positifs de `cdc-quality`, composants orphelins (`PcbProjectWorkspace`, `PcbPriceCounter`, `PcbProposalDiff`, `PcbCanvas.addNodeAtCenter`).

### Dettes Phase D (ajoutées au registre)

| Dette | Description |
|---|---|
| `D-FT-P7-GOLDEN-CATEGORY-RECALL` | Le `recallScore` du golden set porte sur les **6 catégories**, pas sur les types de composants. |
| `D-FT-P7-GOLDEN-LIVE-RUN` | Pas de runner rejouant les 10 CDC contre Groq (`analyze` injecté) → exécution **manuelle** uniquement. |
| `D-FT-P7-CATALOG-PRICE-APPEND` | `POST /api/pcb/catalog/price` crée un `ComponentPrice` à chaque enregistrement (**pas d'upsert**). |

### Dettes Phase E (ajoutées au registre)

| Dette | Description |
|---|---|
| `D-FT-P7-DOUBLE-PASS-COST` | Double passe = **2 appels LLM séquentiels** par analyse (coût/latence ×2). |
| `D-FT-P7-DIVERGENCES-NON-PERSISTED` | Les divergences vivent dans l'état **client** (`report`), pas en base → perdues au `router.refresh()`. |
| `D-FT-P7-LLM-CALLS-X3` | **3 appels LLM** par analyse quand le classement est actif (1 classement + 2 passes) ; 1 seul appel si `doublePass=false` ou `candidates.length <= 5`. |
| `D-FT-P7-CDC-QUALITY-FALSE-POSITIVES` | Les heuristiques d'unités de `cdc-quality` peuvent signaler de faux conflits (rails multiples) → **non bloquant**, à mesurer sur le golden set. |
| `D-FT-P7-ORPHAN-PCB-COMPONENTS` | `PcbProjectWorkspace.tsx`, `PcbPriceCounter.tsx`, `PcbProposalDiff.tsx`, `PcbCanvas.addNodeAtCenter` : **orphelins** (non montés) → nettoyage différé. |

## 10. Schéma par défaut du catalogue de composants (V41)

Table SQLite `components` (une ligne = un composant, un seul fournisseur par ligne, Q27 = C) :

| Champ | Type | Rôle |
|---|---|---|
| `id` | TEXT PK | Identifiant interne (cuid) |
| `mpn` | TEXT | Manufacturer Part Number |
| `manufacturer` | TEXT | Fabricant |
| `description` | TEXT | Description courte (utilisée pour l'embedding) |
| `category` | TEXT | Catégorie fonctionnelle (résistance, condensateur, MCU, connecteur, régulateur, …) |
| `package` | TEXT | Boîtier (0603, SOIC-8, QFP-48, …) |
| `footprint` | TEXT | Empreinte KiCad (`lib:footprint`) |
| `symbol` | TEXT | Symbole KiCad (`lib:symbol`) |
| `electrical` | TEXT (JSON) | Paramètres électriques flexibles par catégorie (tension max, courant, tolérance, valeur, …) |
| `price` | REAL | Prix unitaire |
| `currency` | TEXT | Code ISO (défaut EUR) |
| `supplier` | TEXT | Fournisseur unique (Q27 = C) |
| `supplier_ref` | TEXT | Référence chez le fournisseur |
| `stock` | INTEGER | Stock disponible (avertissement seulement, Q26 = B) |
| `datasheet_url` | TEXT | Lien datasheet |
| `lifecycle` | TEXT | active / NRND / obsolete |
| `source` | TEXT | Provenance (id du modèle open source ou du projet accompli) — V31 |
| `licence` | TEXT | Licence (modèles de référence uniquement) |
| `created_at`, `updated_at` | TEXT (ISO) | Horodatage |

Table virtuelle `components_vec` (sqlite-vec) : embedding de `description` + `category` + `electrical`, synchronisée à l'insertion.

---

## 11. Post-Fast-Track P7 — Travail réalisé (2026-11-21)

### 11.1 A2.5 — Saisie `kicadFilePath` (commit `b370c59`)
- `PATCH /api/pcb/projects/[id]` (auth admin, validation `.kicad_pcb`, `exists` informatif).
- Composant `KicadFileInput` monté dans la barre haute du workspace.
- Dette `D-FT-P7-KICAD-PATH-UNRESTRICTED` consignée.

### 11.2 Multi-provider LLM avec fallback dynamique (`src/lib/ai/groq-client.ts`)
- Fournisseurs essayés en ordre : **Groq → Cerebras → OpenRouter → Google → OpenAI** (selon clés présentes).
- Bascule automatique sur 429/5xx/erreur réseau. Cerebras : modèle par défaut `gpt-oss-120b`.

### 11.3 Compilation IA optimisée (`/api/pcb/requirements/compile`)
- Textarea « Idée générale » (obligatoire) dans `RequirementForm` + panneau « Description technique compilée (IA) ».
- Boutons **Compiler / Relancer / Valider** → un seul textarea « Contexte validé » après validation.
- Phase pré-implantation : `status: 'requirements_validated'` + badge dans la page cahier des charges.
- Prompt couvrant les **6 catégories** (déduction marquée « (déduit) ») → complétude **100 % (6/6)**.

### 11.4 Sourcing composants (`ComponentSourcingPanel` + `/api/pcb/requirements/source-components`)
- L'IA propose une BOM (13-17 composants) depuis le CDC validé.
- Positions offsetées par rapport au plateau réel (origine bbox).
- Résolution automatique des empreintes KiCad (recherche dans toutes les bibliothèques).
- **Bouton « Valider et placer dans KiCad » sur chaque carte de composant** (placement individuel en temps réel).
- E2E validé : dry-run ✅, placement réel ✅, vérification déterministe ✅ (0,01 mm / 0,5°).

### 11.5 Prompt d'analyse optimisé
- Liste canonique des clés par catégorie → accord parfait inter-passes (0 dropped).
- Résultat : 18 exigences, complétude 100 %, 0 sans source.

### 11.6 Diagnostic boucle de chargement dev
- Cause : HMR Turbopack sur disque `F:` (slow filesystem). Contournement : `next dev --webpack`.
- Service worker innocenté (aucun SW, aucun cache sur `localhost:3000`).
- Fix préexistant : `desktop-builds/route.ts` (`GET(request?: Request)` → `GET(request: Request)`) — commit `e32e4c1`.

### 11.7 Vérifications finales
- `npm run typecheck` : exit 0 · `npx vitest run` : 326 passent · `npx prettier --check .` : exit 0.

### 11.8 Itération A — vrai projet KiCad stable (non commité)
- Création de `C:\Users\pc\Documents\PartIVA\projets\carte-test\carte-test.kicad_pcb` + `.kicad_pro` (au lieu de `%TEMP%`).
- `kicadFilePath` du projet `cmwo3y9z50000nsfc1ci309ll` patché ; KiCad GUI ouvert (`carte-test - KiCad 10.0`).
- Dry-run `POST /api/pcb/place` : `200 OK`, `wouldPlace: true`, `footprintCount: 1`.

### 11.9 Réconciliation KiCad (non commité)
- `scripts/kicad/place_footprints.py` : suppression de l'empreinte existante de même référence avant ajout.
- Cause diagnostiquée : doublon `U1` → écart x/y de +100 mm (`attendu 69690000/91280000`, `obtenu 79690000/101280000`) → restauration depuis `.bak`.

### 11.10 Résolution des empreintes IA (non commité)
- Nouveau module pur `src/lib/pcb/kicad-footprints.ts` + 4 tests (`kicad-footprints.test.ts`).
- Ordre : exact → autre bibliothèque → fuzzy normalisé → **fallback par préfixe de référence**.
- Empreinte fautive `Converter_DCDC:DCDC-Module_TO-220` (absente de KiCad 10, fuzzy `why: none`) → `Package_TO_SOT_THT:TO-220-3_Vertical` pour `U1`.
- Câblé dans `POST /api/pcb/requirements/source-components` ; racine configurable via `PARTIVA_KICAD_FOOTPRINTS_ROOT`.
- Vérifications : `npm run typecheck` ✅ · `npx vitest run` ✅ (**330 tests / 38 fichiers**) · `npx prettier --check .` ✅ · dry-run placement avec fallback ✅ (`200 OK`).
- **Rejeu BOM complet (2026-11-22)** : projet cible `cmwqu1s0t0029o0fcugnkd0da` patché vers `C:\Users\pc\Documents\PartIVA\projets\carte-test\carte-test.kicad_pcb` (`200 OK`, `exists: true`). Sourcing IA (15 composants) → **15 clics « Valider et placer dans KiCad »** → `✓ 15 placé(s) · 15 vérifié(s)`, canvas `0 → 15`, 0 erreur. Lecture du `.kicad_pcb` sur disque : 15 références présentes, `U1` → `Package_TO_SOT_THT:TO-220-3_Vertical` à `69.69 / 91.28` mm.
- **Reste à prouver** : apparition réelle dans KiCad GUI et dans le canvas PartIVA (confirmation visuelle du coordinateur).

### 11.11 Itérations C1 + C2 (2026-11-22)
- Plan **C1 → C5** acté par le coordinateur : C1 données, C2 GND, C3 canvas, C4 empreintes, C5 UX.
- **C1.1** : résidu `%TEMP%` supprimé (chemin déjà patché) ; arbitrage = **conserver** `cmwqu1s…` (19 composants / 18 exigences). Projet officiel `cmwo3y9…` confirmé (0 composant, 0 réseau).
- **C1.2** : `src/lib/pcb/kicad-path.ts` + tests ; `PATCH /api/pcb/projects/[id]` refuse les chemins temporaires.
- **C2 (Option A)** : `pending = nets.length === 0`, plus de violation `GROUND_PLANE` garantie ; `simulation.test.ts` (3 tests).
- **C2-bis** : panneau Conformité remonté en tête de colonne ; badge « PAS ENCORE ANALYSÉ » vérifié en navigateur.
- **Vérifications** : typecheck ✅ · **341 tests / 40 fichiers** ✅ · prettier ✅ · contrôle visuel ✅.
- **Dettes** : `D-FT-P7-GND-NETS-NOT-SEEDED` ; `D-FT-P7-KICAD-PATH-UNRESTRICTED` partiellement mitigée.
- **Arrêt au C2-bis** (C3 non démarré, conformément au prompt).
- **Livraison** : commit `398930c` poussé sur `origin/fast-track/p7-dashboard-pcb` ; le montage de `ComponentSourcingPanel` dans `page.tsx` reste volontairement non commité (travail antérieur).

### 11.12 Clôture documentaire et commit post-Fast-Track (2026-11-22)

- **SYNC-1-bis** : écarts E10 (DECISIONS sans entrée Fast-Track), E11 (INDEX sans P7) et E12 (INDEX sans Post-Fast-Track) confirmés.
- **SYNC-2-a** : portage de 16 dettes actives (2 critiques + 14 fonctionnalités) + 2 dettes soldées dans `DETTES.md`.
- **SYNC-2-b** : portage de V1-V44 + Phases A-E dans `DECISIONS.md` §15 (V6 absent, supprimé au cadrage).
- **SYNC-2-c** : indexation des sessions Fast-Track P7 et Post-Fast-Track dans `INDEX.md`.
- **SYNC-2-d** : annotation de clôture de `FAST_TRACK_P7.md` (statut `CLOS le 2026-11-22` + §4 de traçabilité, corps historique inchangé).
- **SYNC-3** : commit du code post-Fast-Track — multi-provider LLM (Groq → Cerebras → OpenRouter → Google → OpenAI), `/requirements/compile` (6 catégories), `ComponentSourcingPanel` + `/requirements/source-components`, `kicad-footprints.ts` (4 tests), glisser-déposer canvas, affichage TND.
- **Revue SYNC-3** : `PriceCard` (condition tautologique), `groq-client` (bloc mort), `.env.example` restauré (doublon `CEREBRAS_API_KEY`, clés `TOGETHER`/`DEEPINFRA` inutilisées, U+FFFD introduits).
- **Vérifications** : `npm run typecheck` ✅ (exit 0) · `npx vitest run` ✅ (**341 tests / 40 fichiers**) · `npx prettier --check .` ✅.
- **Dettes** : `D-FT-P7-CURRENCY-HARDCODED`, `D-FT-P7-CANVAS-ORIGIN-HARDCODED`, `D-FT-P7-SOURCING-AUTOLOAD-COST`.
- **Reste** : SYNC-4 (merge fast-forward sur `master` + prompt v8.13) après validation explicite ; C3 non démarré.
