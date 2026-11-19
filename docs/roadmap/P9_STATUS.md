# P9 — État du branchement des données CAO

**Version :** 1.0
**Date :** 2026-11-19
**Commit de référence :** `acb4459`
**Statut :** Câblage défensif réalisé — données réelles indisponibles (schéma Prisma à étendre)

---

## 1. Vérification du schéma Prisma

### Résultat

Le modèle `PcbProject` (`prisma/schema.prisma:673-690`) **ne contient aucun champ ni relation** permettant de stocker ou récupérer des fichiers CAO (STEP/IGES) :

```prisma
model PcbProject {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      String   @default("draft")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  requirements PcbRequirement[]
  components   PcbComponent[]
  nets         PcbNet[]
  proposals    PcbProposal[]
  validations  PcbValidation[]
  checkpoints  PcbCheckpoint[]
  versions     PcbVersion[]

  @@map("pcb_projects")
}
```

### Modèle le plus proche

`CadFile` (`prisma/schema.prisma:235-250`) stocke des fichiers CAO (`url`, `fileType`, `name`, `sizeBytes`) mais est rattaché à `ReverseEngineeringProject` / `Request` — **pas** à `PcbProject` :

```prisma
model CadFile {
  id        String                     @id @default(cuid())
  projectId String?
  requestId String?
  name      String
  url       String
  fileType  FileType
  sizeBytes Int?
  ...
}
```

### Proposition (à valider)

Ajouter au schéma, pour débloquer P9 :

```prisma
model PcbProject {
  ...
  cadFileUrl String?   // URL du fichier CAO (STEP/IGES) du projet
  cadFileName String?  // nom d'origine (détection du format)
  ...
}
```

**Prérequis :** migration Prisma (`prisma migrate dev`) + `prisma generate` + application en base. Non exécuté dans cette étape (hors périmètre P9, aucune migration demandée).

---

## 2. Modifications de la page projet

Fichier : `src/app/admin/pcb/[projectId]/page.tsx`

- Ajout d'un type local `ProjectWithOptionalCad = { cadFileUrl?: string | null }`.
- Lecture défensive : `const cadFileUrl = (project as ProjectWithOptionalCad).cadFileUrl ?? undefined;`
- Mapping vers `GeometrySource` :

```ts
const comparisonLayers = cadFileUrl
  ? [{ url: cadFileUrl, mode: 'original' as const, color: '#3B82F6' }]
  : undefined;
```

- Passage de la prop : `<VisualComparisonOverlay projectId={projectId} layers={comparisonLayers} />`.

**Comportement :**
- Aujourd'hui (`cadFileUrl` absent) → `layers = undefined` → repli SVG schématique (aucune régression).
- Après ajout du champ `cadFileUrl` → `layers` peuplé → rendu CAO réel (Canvas Three.js) activé automatiquement, sans autre modification.

---

## 3. Limitations actuelles

1. **Aucune donnée CAO persistée** — `PcbProject` n'a pas de champ CAO ; le branchement est inactif en production.
2. **Un seul fichier** — la prop `layers` est alimentée par une unique URL (`cadFileUrl`) ; le support multi-couches (comparaison réelle original/reviewed/sourced/exported) nécessitera plusieurs champs ou une table de variantes.
3. **Type par assertion** — la lecture défensive repose sur un cast (`as ProjectWithOptionalCad`) tant que le champ n'existe pas dans le client Prisma. À supprimer une fois le schéma migré (accès direct `project.cadFileUrl`).
4. **Format** — `LayerMesh` déduit le format de l'extension de l'URL ; prévoir `cadFileName` si l'URL n'a pas d'extension explicite.

---

## 4. Prochaine étape

- Arbitrer l'ajout des champs `cadFileUrl` / `cadFileName` à `PcbProject` (migration Prisma).
- Alimenter la comparaison multi-couches (4 variantes) si le besoin métier est confirmé.
- Vérifier build + lint + E2E (hors périmètre P9).