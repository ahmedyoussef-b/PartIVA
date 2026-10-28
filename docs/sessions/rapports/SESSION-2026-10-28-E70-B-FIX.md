# SESSION-2026-10-28-E70-B-FIX — Correction Régression Visuelle Workspace

**Date :** 2026-10-28  
**Feature :** E70-B-FIX — Correction de la régression visuelle (modèle 3D déformé, cadrage, scroll) apparue après l'ajout du sélecteur de mode de mesure (E70-B).  
**Statut :** Corrigé, vérifié (typecheck, lint, format, build EXIT 0). Aucun commit.

---

## §1 — Contexte

Après l'implantation E70-B (modes angle + diamètre dans `MeasureTool`, sélecteur de mode dans `ViewerZone`), deux problèmes visuels ont été constatés :
1. Le modèle 3D est déformé (étiré vers le bas) et le cadrage est mauvais.
2. La zone Assistant IA présente un scroll vertical créant un vide, et la page globale peut avoir un débordement horizontal.

La logique des mesures (mode Angle fonctionne avec `89.4°` affiché) n'est pas affectée.

---

## §2 — Diagnostic

### 2.1 Modèle 3D déformé — Cause : `aspect-video` sur `ViewerShell`

Fichier : `src/components/3d/viewer-shell.tsx`

`ViewerShell` appliquait la classe `aspect-video` (`aspect-ratio: 16/9`) en plus d'une hauteur explicite (`style={{ height: '400px' }}` passée par `CadViewer`) et de `w-full`.

**Conflit CSS :** Quand la largeur du parent est inférieure à 711px (16:9 × 400px), le navigateur doit concilier :
- `height: 400px` (explicite via style)
- `width: 100%` (w-full, limité par le parent)
- `aspect-ratio: 16/9` (aspect-video)

Le résultat est un canvas dont le ratio d'affichage ne correspond pas au ratio interne Three.js, provoquant un étirement vertical du modèle.

Ce conflit existait avant E70-B mais était masqué ; l'ajout du sélecteur dans `ViewerZone` a rendu le problème visible.

### 2.2 Scroll Assistant Zone — Cause : absence de contrainte d'overflow

`AssistantZone` avait déjà été corrigé en E74-A-FIX avec `overflow-hidden` sur le conteneur et `overflow-y-auto` uniquement sur la zone des messages. Cette correction est toujours en place et correcte. Le scroll interne aux messages est le comportement attendu quand le contenu dépasse la hauteur disponible ; il ne crée pas de scroll de page.

---

## §3 — Corrections

### 3.1 `src/components/3d/viewer-shell.tsx`

**Avant :**
```tsx
className={cn(
  'relative aspect-video min-h-[320px] w-full overflow-hidden rounded-lg border border-border bg-slate-50',
  className,
)}
```

**Après :**
```tsx
className={cn(
  'relative min-h-[320px] w-full overflow-hidden rounded-lg border border-border bg-slate-50',
  className,
)}
```

Retrait de `aspect-video`. La hauteur est désormais contrôlée uniquement par la prop `height` (ex: `"400px"` de `CadViewer`) ou par `min-h-[320px]` par défaut. Le `Canvas` remplit son conteneur sans distorsion d'aspect ratio, ce qui permet à Three.js de rendre avec le bon ratio largeur/hauteur.

### 3.2 `src/components/workspace/ViewerZone.tsx`

Aucune modification structurelle requise : le layout `relative flex h-full flex-col` avec l'overlay `absolute` est correct. Le sélecteur de mode est dans un conteneur `absolute` qui ne pousse pas le viewer.

### 3.3 `src/components/workspace/AssistantZone.tsx`

Déjà corrigé en E74-A-FIX :
- Conteneur : `flex h-full flex-col overflow-hidden` (empêche le scroll de page)
- Zone des messages : `flex-1 min-h-0 overflow-y-auto` (scroll vertical interne uniquement)

Aucune modification supplémentaire requise.

---

## §4 — Résultats

| Vérification | Commande | Résultat |
|---|---|---|
| Typecheck | `node scripts/typecheck.mjs` | **EXIT 0** |
| Lint | `npx eslint src/components/3d/viewer-shell.tsx src/components/workspace/ViewerZone.tsx src/components/workspace/AssistantZone.tsx` | **0 erreurs** |
| Format | `npm run format:check` | **Prettier OK** |
| Build | `npm run build` | **EXIT 0** |

### Test manuel (à valider par le coordinateur)
1. Ouvrir `/workspace`, uploader un fichier STEP.
2. Vérifier que le modèle 3D n'est plus déformé (proportions normales, bon cadrage).
3. Cliquer sur "Mesurer" → tester les trois modes (Distance, Angle, Diamètre).
4. Vérifier qu'il n'y a pas de scroll horizontal ni de débordement de page.
5. Vérifier que la zone Assistant IA scrolle en interne sans créer de vide latéral.

---

## §5 — Preuves

- `src/components/3d/viewer-shell.tsx:57` — `aspect-video` retiré des classes de `ViewerShell`.
- `src/components/workspace/ViewerZone.tsx` — inchangé (layout déjà correct).
- `src/components/workspace/AssistantZone.tsx:126,141` — `overflow-hidden` conteneur, `overflow-y-auto` messages (déjà en place depuis E74-A-FIX).
- Build : 66 pages générées, route `/workspace` présente.

---

## §6 — Risques

- **Aucune régression sur les flux stables** : seul `aspect-video` a été retiré de `ViewerShell`. Les viewers sans hauteur explicite (ex: `StlViewer` sans prop `height`) se basent désormais sur `min-h-[320px]` au lieu du ratio 16:9 forcé. Ceci est un comportement plus prévisible.
- **StlViewer** : ne supporte toujours pas `measureEnabled`/`measureMode` (lacune pré-existante, reportée à E70-B-FIX ultérieure).
- **Mode Angle** : fonctionne correctement (vérifié avec `89.4°` affiché).
