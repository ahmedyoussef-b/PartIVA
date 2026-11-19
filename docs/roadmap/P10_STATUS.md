# P10 — Migration Prisma & activation du rendu CAO

**Version :** 1.0
**Date :** 2026-11-19
**Commit de référence :** `b98d81a`
**Statut :** Migration appliquée + client régénéré + code nettoyé — activation prête (données à renseigner)

---

## 1. Modification du schéma

Fichier : `prisma/schema.prisma` — modèle `PcbProject`

```prisma
model PcbProject {
  id          String   @id @default(cuid())
  name        String
  description String?
  status      String   @default("draft") // draft | requirements_validated | design_validated | manufacturing_ready
  cadFileUrl  String?
  cadFileName String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  ...
}
```

- `cadFileUrl String?` — URL du fichier CAO (STEP/IGES).
- `cadFileName String?` — nom d'origine (détection du format côté `LayerMesh`).

---

## 2. Génération et migration

| Étape | Commande | Résultat |
|---|---|---|
| Génération du client | `npx prisma generate` | **OK** — Prisma Client 7.10.0 généré dans `src/generated/prisma` |
| Migration | `npx prisma migrate dev --name add_cad_fields_to_pcb_project` | **OK** — migration appliquée |

- **Nom de la migration :** `20261119182505_add_cad_fields_to_pcb_project`
- **Fichier :** `prisma/migrations/20261119182505_add_cad_fields_to_pcb_project/migration.sql`
- **Base cible :** PostgreSQL `neondb` (Neon), schéma `public` — « Database is now in sync with your schema. »

---

## 3. Nettoyage du code

Fichier : `src/app/admin/pcb/[projectId]/page.tsx`

- Type local `ProjectWithOptionalCad` **supprimé**.
- Cast défensif `(project as ProjectWithOptionalCad).cadFileUrl` **remplacé** par l'accès typé officiel `project.cadFileUrl`.
- `comparisonLayers` enrichi de `name: project.cadFileName ?? undefined` (détection du format).

```ts
const cadFileUrl = project.cadFileUrl ?? undefined;
const comparisonLayers = cadFileUrl
  ? [
      {
        url: cadFileUrl,
        name: project.cadFileName ?? undefined,
        mode: 'original' as const,
        color: '#3B82F6',
      },
    ]
  : undefined;
```

---

## 4. Statut de l'activation du rendu CAO

- **Chaîne complète opérationnelle :** `PcbProject.cadFileUrl` → `page.tsx` (`comparisonLayers`) → `VisualComparisonOverlay` (`layers`) → `LayerMesh` (`importCadFile` + `tessellateShape`) → `<Canvas>` Three.js.
- **Activation conditionnelle :** si `cadFileUrl` est `NULL` (cas par défaut), `layers = undefined` → repli SVG (aucune régression).
- **Il reste à renseigner `cadFileUrl`** pour un projet donné (upload / saisie) afin de visualiser la géométrie réelle.

---

## 5. Limites / suites

1. **Un seul fichier CAO** par projet (`cadFileUrl`) — la comparaison multi-couches (4 variantes) nécessitera un champ/table dédié.
2. **Pas d'UI d'upload** liée à `cadFileUrl` — à prévoir (ou réutiliser le flux CAO existant).
3. **Non vérifié :** build / lint / E2E (proscrits par le prompt P10) — à lancer avant merge.
4. **Migration distante** : la migration a été appliquée à la base Neon de développement ; prévoir l'application en staging/prod via `prisma migrate deploy`.