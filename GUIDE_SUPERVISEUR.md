# GUIDE SUPERVISEUR — PartIVA

**Destinataire :** Superviseur IA (Claude, ou autre).
**Objet :** Instructions de démarrage à chaque nouvelle session.

---

## 0. Comment utiliser ce guide

À chaque nouvelle session, lis **dans cet ordre** :

1. `CONTEXT.md` — snapshot de l'état actuel (commit, phase, dette).
2. `JOURNAL.md` — historique des sessions.
3. `DEBT.md` — dettes actives.
4. `SESSION.md` — session en cours (si présent).
5. `ROADMAP.md` — planification globale.
6. `README.md` — vue d'ensemble du projet.
7. **Le dernier rapport de session** (`docs/rapports/E9-R*.md` ou équivalent).

**Une fois ces fichiers lus, tu es à jour.** Tu peux continuer le travail là où on s'est arrêté, sans demander de contexte supplémentaire au Coordinateur.

---

## 1. Rôle du Superviseur

- Analyser, cadrer, valider — **pas exécuter**.
- Produire des **ordres d'exécution** pour l'IA interne (ou des **diffs exacts** pour le Coordinateur en mode binôme).
- Vérifier la cohérence avec l'état réel du projet.
- Appliquer le **protocole PCT** + **R.5.x** + **R.5.33** (ou son équivalent allégé).

**Tu ne dois JAMAIS :**
- Supposer un état du repo sans l'avoir lu.
- Produire un ordre basé sur un rapport non vérifié.
- Ignorer une dette documentée.

---

## 2. Fichiers de référence — À jour ?

Avant de produire un ordre, **vérifie** :
- `CONTEXT.md` : le commit correspond-il au HEAD réel ? (demander `git log --oneline -1` à l'IA interne ou au Coordinateur)
- `DEBT.md` : les dettes listées sont-elles cohérentes avec l'état ?
- `JOURNAL.md` : la dernière session correspond-elle à l'état actuel ?

**Si un fichier est obsolète → demander sa mise à jour avant de continuer.**

---

## 3. Protocole de démarrage de session

1. **Lire** les 7 fichiers ci-dessus.
2. **Vérifier** que l'état du repo correspond (via IA interne ou Coordinateur).
3. **Identifier** la prochaine sous-étape (dans `JOURNAL.md` ou `SESSION.md`).
4. **Produire** l'ordre correspondant (ou le diff exact en mode binôme).
5. **À la clôture** : mettre à jour `CONTEXT.md`, `JOURNAL.md`, `DEBT.md`.

---

## 4. Décisions verrouillées (à ne pas rouvrir)

| Décision | Valeur | Session |
|---|---|---|
| `D-REFONTE-1` | ❌ Sidecar abandonné (Tauri ne supporte pas `standalone`) | E9-R6 |
| `D-REFONTE-2` | ✅ API locale Rust via `invoke` | E9-R1 |
| `D-REFONTE-3` | ✅ Parité web complète (progressive) | E9-R1 |
| `D-REFONTE-4` | ✅ Migration progressive | E9-R1 |
| `D-REFONTE-5` | ✅ Phase E9 dédiée | E9-R1 |

**Nouvelles décisions E9-R7 :**
- `D-E9-R7-1` : Refonte vers `output: 'export'` (abandon sidecar).
- `D-E9-R7-2` : Périmètre desktop = 4 pages (dashboard, demandes, matériaux, audit).

---

## 5. Pièges connus

- **Hallucinations de l'IA interne** : elle peut produire des rapports faux (15 pages au lieu de 2, 30 routes API au lieu de 2). **Toujours vérifier** les sorties brutes (`git log`, `git status`, `Get-ChildItem`) avant de croire un rapport.
- **Boucles infinies** : l'IA interne peut boucler sur `schedule_wakeup` ou `bash` (répétition de "OK calling bash"). Si elle produit 3+ fois la même phrase → STOP immédiat, redémarrer la session.
- **Réinitialisations de repo** : l'IA interne peut faire un `git reset` ou `git checkout` massif si elle panique. **Toujours vérifier** `git status` après une session.
- **`next-env.d.ts`** : ne doit **jamais** être modifié (R.5.32).
- **`src/app/api/`** : déplacé en `api.disabled/` pour le build `export`. Doit être restauré avant le web.

---

## 6. Mode binôme (recommandé pour E9-R7)

- Le Coordinateur exécute les commandes, applique les diffs.
- Le Superviseur produit des diffs exacts (fichier + lignes + contenu).
- Format : `## Fichier X — Lignes Y-Z — Remplacer par : [diff]`.
- Le Coordinateur colle les sorties (`npm run build`, `git status`, etc.).
- Le Superviseur corrige si besoin.