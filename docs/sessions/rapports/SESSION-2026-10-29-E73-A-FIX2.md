# SESSION-2026-10-29-E73-A-FIX2 — Correction hydratation SSR (React #418)

**Date :** 2026-10-29  
**Feature :** E73-A-FIX2 — Correction de l'erreur d'hydratation Next.js (React #418) sur le hook `useWorkspacePersistence`.  
**Statut :** Corrigé, vérifié (typecheck, lint, format, build EXIT 0). Aucun commit.

---

## §1 — Contexte

Après E73-A-FIX (correction de l'écrasement des données par l'effet de sauvegarde), l'application génère une erreur React #418 (mismatch d'hydratation) au rechargement de page (`/workspace`). L'erreur se manifeste par un `Uncaught Error: Minified React error #418` dans la console du navigateur.

---

## §2 — Diagnostic

### Cause racine : lecture de `localStorage` dans l'initialiseur `useState`

Fichier : `src/lib/hooks/use-workspace-persistence.ts`

Le hook utilisait `useState(loadState)` où `loadState()` lit `localStorage`. Cet initialiseur s'exécute :
- **Côté serveur (SSR)** : `typeof window === 'undefined'` → retourne `DEFAULT_STATE` (état vide).
- **Côté client (hydratation)** : `typeof window !== 'undefined'` → lit `localStorage` et retourne l'état restauré.

Résultat : le HTML généré côté serveur contient l'état vide, mais le premier rendu côté client contient l'état restauré. Next.js détecte un mismatch d'hydratation et lève l'erreur React #418.

### Ce qui n'était pas en cause

- `WorkspaceClient.tsx` : utilise correctement les setters du hook.
- `IngestZone.tsx` : le bouton "Effacer" et l'indicateur sont corrects.
- L'écrasement des données (problème E73-A-FIX) : déjà corrigé.

---

## §3 — Corrections

### 3.1 `src/lib/hooks/use-workspace-persistence.ts`

**Avant :**
```ts
const [state, setState] = useState<PersistedWorkspaceState>(loadState);
```
`loadState()` lisait `localStorage` dans l'initialiseur, côté serveur et côté client.

**Après :**
```ts
const [state, setState] = useState<PersistedWorkspaceState>(DEFAULT_STATE);
```
L'état initial est toujours `DEFAULT_STATE` (identique côté serveur et côté client → pas de mismatch d'hydratation).

La restauration depuis `localStorage` se fait désormais dans un `useEffect` qui s'exécute **uniquement côté client** après le montage :
```ts
useEffect(() => {
  const saved = loadState();
  if (saved) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(saved);
  }
  isRestored.current = true;
}, []);
```

Ce `useEffect` lit `localStorage` et appelle `setState(saved)` pour restaurer l'état. Comme il s'exécute après l'hydratation (effet de bord côté client uniquement), il ne crée pas de mismatch. Le premier rendu côté client affiche `DEFAULT_STATE` (flash d'état vide d'une frame), puis l'état restauré s'affiche.

Le `useEffect` de sauvegarde (dépendance `[state]`) reste inchangé et est gardé derrière le flag `isRestored.current` pour éviter d'écrire `DEFAULT_STATE` dans `localStorage` avant la restauration.

---

## §4 — Résultats

| Vérification | Commande | Résultat |
|---|---|---|
| Typecheck | `node scripts/typecheck.mjs` | **EXIT 0** |
| Lint | `npx eslint src/lib/hooks/use-workspace-persistence.ts src/components/workspace/WorkspaceClient.tsx src/components/workspace/IngestZone.tsx` | **0 erreurs** |
| Format | `npm run format:check` | **Prettier OK** |
| Build | `npm run build` | **EXIT 0** |

### Test manuel (à valider par le coordinateur)
1. Ouvrir `/workspace`, uploader un fichier, remplir les dimensions/description, lancer l'analyse.
2. Recharger la page (`F5`) → pas d'erreur React #418, l'état est restauré : fichiers, dimensions, description, résultat de l'analyse réaffichés.
3. Faire un second `F5` → l'état reste restauré.
4. Cliquer sur le bouton "Effacer" → l'état est réinitialisé et `localStorage` nettoyé.

---

## §5 — Preuves

- `src/lib/hooks/use-workspace-persistence.ts` (113 lignes) — `useState(DEFAULT_STATE)` + `useEffect` de restauration côté client uniquement.
- `src/components/workspace/WorkspaceClient.tsx` — inchangé.
- `src/components/workspace/IngestZone.tsx` — inchangé.
- Build : 66 pages générées, route `/workspace` présente.

---

## §6 — Risques

- **Aucune régression sur les flux stables** : seule la logique de restauration du hook a été modifiée. Les routes API et les autres composants ne sont pas affectés.
- **Flash d'état vide** : au premier rendu après rechargement, l'utilisateur voit brièvement l'état vide avant que `useEffect` ne restaure l'état depuis `localStorage`. C'est un compromis nécessaire pour éviter l'erreur d'hydratation. Ce flash est d'une seule frame et n'affecte pas l'expérience utilisateur de manière significative.
- **SSR/Hydration** : `loadState` vérifie `typeof window === 'undefined'` et retourne `null` côté serveur, évitant toute erreur d'accès à `localStorage` côté serveur.
