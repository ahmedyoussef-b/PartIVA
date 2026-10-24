# Diagnostic Bouton "Nouveau projet RE"

## Fichier analysé
- Chemin : `src/app/admin/reverse-engineering/reverse-engineering-list-client.tsx`
- Ligne du bouton : 59

## Code du bouton (extrait)
```tsx
  52 |       <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
  53 |         <div>
  54 |           <h1 className="text-2xl font-bold tracking-tight">Reverse Engineering</h1>
  55 |           <p className="text-muted-foreground mt-0.5 text-sm">
  56 |             Projets de rétro-ingénierie CAO — {projects.length} projet(s)
  57 |           </p>
  58 |         </div>
  59 |         <Button className="gap-2 text-xs font-semibold">Nouveau projet RE</Button>
  60 |       </div>
```

## Type de bouton
- [ ] Link Next.js avec href
- [x] Button shadcn avec onClick
- [ ] Button HTML natif
- [ ] Autre : [préciser]

## Handler détecté
- href : aucun
- onClick : aucun
- Modal/Dialog : aucun (aucun `useState` de modal/dialog n'est déclaré dans ce composant)

## Page de destination
- URL cible : non définie
- Page existe : Non
- Chemin : n/a (aucun fichier `new/page.tsx` ni `create/page.tsx` dans `src/app/admin/reverse-engineering/` ; le seul sous-dossier est `[id]/page.tsx`)

## Cause racine identifiée
Le bouton "Nouveau projet RE" (ligne 59 de `reverse-engineering-list-client.tsx`) est un `<Button>` shadcn/ui dépourvu de toute interactivité :
1. Il n'a **aucune prop `href`** (ce n'est pas un `<Link>`, donc aucune navigation n'est possible).
2. Il n'a **aucune prop `onClick`** (aucune fonction n'est appelée au clic).
3. Le composant `ReverseEngineeringListClient` ne déclare **aucun `useState`** pour ouvrir un modal/dialog de création de projet.
4. Il n'existe **aucune page de destination** (`/admin/reverse-engineering/new` ou `/admin/reverse-engineering/create`) vers laquelle le bouton pourrait rediriger.

Résultat : le bouton est visuellement rendu mais fonctionnellement inerte — cliquer dessus ne produit ni navigation, ni ouverture de modal, ni erreur console (silent failure).

## Fix proposé
Deux options possibles :

**Option A — Navigation vers une page de création (recommandé si une page dédiée existe ou doit être créée) :**
1. Créer la page `src/app/admin/reverse-engineering/new/page.tsx` avec un formulaire de création de projet RE.
2. Remplacer le bouton par un `<Link href="/admin/reverse-engineering/new">` enveloppant le `<Button>`, ou ajouter `asChild` / `href` selon la version du composant Button shadcn utilisé.

**Option B — Ouverture d'un modal de création dans la page liste :**
1. Ajouter un `const [createDialogOpen, setCreateDialogOpen] = React.useState(false);` dans `ReverseEngineeringListClient`.
2. Ajouter `onClick={() => setCreateDialogOpen(true)}` sur le bouton.
3. Ajouter un composant `<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>` contenant le formulaire de création et appelant l'action `createREProject` depuis `@/lib/actions/reverse-engineering`.

Dans les deux cas, il faut s'assurer que l'action serveur de création de projet existe dans `src/lib/actions/reverse-engineering.ts` et que le projet créé redirige vers sa page `[id]`.