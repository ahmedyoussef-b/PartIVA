# RAPPORT-ETAT-DES-LIEUX-E74 — Conversion Candidat → Pièce

**Date :** 2026-10-28  
**Objectif :** Etat des lieux ciblé avant proposition d'implantation E74-A.  
**Contrainte respectée :** Aucun code modifié, aucune implantation proposée.

---

## §1 Audit de `createPart`

### Fichier
`src/lib/actions/parts.ts` (193 lignes), marqué `'use server'`.

### Signature
```ts
export async function createPart(
  formData: FormData,
): Promise<{ success: true; partId: string } | { success: false; error: string }>
```

### Champs (validation Zod, lignes 13-17)
- `partNumber`: `z.string().min(1)` — **obligatoire**
- `name`: `z.string().min(3)` — **obligatoire**
- `description`: `z.string().optional()`

### Flux actuel (lignes 24-192)
1. Lecture des champs texte depuis `FormData`.
2. Validation Zod.
3. Vérification de session : requiert `session.user` avec `role === 'ADMIN'`, sinon `{ success: false, error: 'Accès non autorisé' }`.
4. Création Prisma `prisma.part.create` avec `status: 'DRAFT'`, `clientId: session.user.id`.
5. Upload des images (`formData.getAll('images')`) vers Cloudinary via `uploadToCloudinary`, puis création des enregistrements `PartImage` (url, publicId, altText, caption, order, isPrimary).
6. Retour `{ success: true, partId }` ou `{ success: false, error }` (gestion P2002 partNumber dupliqué, ZodError, UploadError).

### Appelant existant
`src/app/admin/pieces/nouveau/pieces-form.tsx:48` — formulaire admin uniquement, envoi multipart avec partNumber, name, description et images. Bouton "Créer la pièce" désactivé si `images.length === 0`.

### Doublon pertinent
`src/lib/data/parts.ts:130` expose `createPartWithPtvReference(data: Prisma.PartCreateInput)` utilisé par `src/app/api/parts/route.ts:68`. Ce dernier génère une référence PTV et retente en cas de violation d'unicité.

---

## §2 Audit du schéma Prisma

### Fichier
`prisma/schema.prisma` (550 lignes).

### Modèle `Part` (lignes 77-110)
```prisma
model Part {
  id                String       @id @default(cuid())
  partNumber        String       @unique
  name              String
  description       String?
  status            PartStatus   @default(DRAFT)
  categoryId        String?
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  clientId          String?
  ptvReference      String?      @unique
  searchVector      Unsupported("tsvector")? @map("search_vector")
  autoCategory      String?
  material          String?
  machineId         String?
  printableModelUrl String?      <-- champ susceptible de stocker une URL de fichier 3D
  attachments       Attachment[]
  fitReports        FitReport[]
  vehicleFitments   Fitment[]
  images            PartImage[]
  specifications    PartSpecification[]
  suppliers         PartSupplier[]
  versions          PartVersion[]
  category          PartCategory? @relation(...)
  client            User?        @relation("PartClient", ...)
  machine           Machine?     @relation(...)
  projects          ReverseEngineeringProject[]
}
```

### Champs disponibles pour un fichier 3D
- `Part.printableModelUrl` (`String?`) : champ texte libre, URL potentielle d'un modèle 3D.
- `Part.attachments` (`Attachment[]`) : `Attachment` (lignes 278-293) possède `url`, `fileType` (enum `FileType`: IMAGE, PDF, CAD_STL, CAD_STEP, CAD_OBJ, OTHER), `mimeType`, `publicId`, `sizeBytes`, `kind` (enum `AttachmentKind`: DOCUMENT, CAD, SCAN, OTHER). C'est le support natif pour un fichier CAO/3D.
- `PartImage.url` : réservé aux images (upload Cloudinary, validation MIME image uniquement dans `createPart`).

### Modèle `SearchCandidate` (lignes 389-407)
Table `search_candidates`, utilisée par la recherche du moteur IA (pas directement par `createPart`). Champs : id, source, reference, name, manufacturer?, imageUrl?, cadAvailable, datasheetAvailable, scores, metadata.

### Enum `PartStatus` (lignes 477-489)
DRAFT, SUBMITTED, ON_HOLD, IDENTIFYING, IDENTIFIED, MEASURING, READY, ORDERED, DELIVERED, ARCHIVED, CANCELLED.

---

## §3 Audit `CandidateCard.tsx` et `AssistantZone.tsx`

### `src/components/workspace/CandidateCard.tsx` (57 lignes)
Props :
```ts
interface CandidateCardProps {
  candidate: SearchCandidate;
  onSelect?: (id: string) => void;
}
```
- Affiche thumbnail, nom, source (Local/Web), barre de score.
- Bouton existant : **"Voir"** (lignes 37-45), affiché uniquement si `candidate.fileUrl && onSelect`; appelle `onSelect(candidate.id)`.
- Aucun bouton "Sélectionner" / "Convertir" / "Créer pièce" n'existe.
- `SearchCandidate` défini dans `src/core/ai-engine/skills/search/types.ts:13` : `{ id, source: 'local'|'web', name, score, fileUrl?, thumbnailUrl?, metadata }`. Aucun champ partNumber.

### `src/components/workspace/AssistantZone.tsx` (165 lignes)
Props : `{ result: EngineResult | null, status, error }`.
- Affiche les messages d'ingestion, recherche, reconstruction, archivage.
- Rend la liste des candidats (lignes 149-155) :
```tsx
{result?.search?.candidates?.length ? (
  <div className="mt-2 space-y-2">
    {result.search.candidates.map((c: SearchCandidate) => (
      <CandidateCard key={c.id} candidate={c} />
    ))}
  </div>
) : null}
```
- **Aucun `onSelect` n'est passé** à `CandidateCard` : le bouton "Voir" est donc masqué actuellement.
- Aucun bouton de conversion au niveau de la liste des candidats.

---

## §4 Audit `WorkspaceClient.tsx`

### Fichier
`src/components/workspace/WorkspaceClient.tsx` (112 lignes).

### État
- `result: EngineResult | null` (ligne 28), initialisé à `null`.
- `status`, `error`, `photos`, `cadFiles`, `dimensions`, `description`, `mode`, `extractedDimensions`.
- **Aucun état `selectedCandidate` n'existe.**

### Flux
- `handleSubmit()` (lignes 51-79) POST sur `/api/engine` avec `{ photos, cadFiles, dimensions, description, mode }`, stocke `data` dans `result` (typé `EngineResult`).
- `EngineResult` (`src/core/ai-engine/engine.ts:12`) : `{ ingest, search, reconstruct, archive }`.
- Transmet `result` à `<AssistantZone result={result} status={status} error={error} />` (ligne 108).
- `result.archive.archivedPartId` est déjà affiché dans AssistantZone (ligne 117), indiquant un lien existant entre l'engine et une pièce archivée.

### Route API
`src/app/api/engine/route.ts` : appelle `runEngine(input, { mode })` et renvoie `{ success: true, ...result }`.

---

## §5 Cartographie des options d'implémentation

### Option A — Bouton "Convertir en pièce" dans `CandidateCard`, appel d'une action serveur `convertCandidateToPart`

- **Faisabilité :** Élevée. `CandidateCard` reçoit déjà `candidate` (id, name, fileUrl, thumbnailUrl, metadata). Il suffit d'ajouter un `onConvert?: (candidate: SearchCandidate) => void` prop et un bouton.
- **Risque :** Moyen. `createPart` exige une session **ADMIN** et des champs `partNumber` + `name` obligatoires. Un candidat n'a pas de `partNumber` ; il faudrait le synthétiser ou le demander. L'action serveur est dans `src/lib/actions/parts.ts`, isolée et réutilisable.
- **Impact sur les flux stables :** Faible. `CandidateCard` est un composant présentatif isolé ; ajouter une prop optionnelle ne casse pas l'appelant actuel (`AssistantZone` ne passe pas `onSelect`).

### Option B — Bouton dans `AssistantZone` (au niveau de la liste des candidats)

- **Faisabilité :** Élevée. `AssistantZone` détient `result.search.candidates` et peut ajouter une barre d'actions ou un bouton par candidat.
- **Risque :** Moyen. Même contrainte que A (ADMIN, partNumber requis). De plus, `AssistantZone` mélange affichage de messages et liste des candidats ; ajouter une logique de conversion y mélange les responsabilités.
- **Impact sur les flux stables :** Faible à moyen. Modification localisée dans `AssistantZone.tsx`, pas de contact avec `WorkspaceClient` sauf si un état de sélection remonte.

### Option C — Flux de sélection (clic sur la carte) puis bouton global "Convertir la sélection"

- **Faisabilité :** Moyenne. Nécessite d'ajouter un état `selectedCandidate` dans `WorkspaceClient`, de le propager à `AssistantZone` → `CandidateCard` (via `onSelect`), puis d'exposer un bouton global de conversion.
- **Risque :** Moyen-élevé. Touche trois composants (`WorkspaceClient`, `AssistantZone`, `CandidateCard`) et crée un état partagé plus complexe. Dépend toujours d'une action serveur de conversion avec les mêmes contraintes (ADMIN, partNumber).
- **Impact sur les flux stables :** Moyen. Modifie le contrat de `CandidateCard` (rendre `onSelect` effectif) et introduit un nouvel état dans `WorkspaceClient`.

### Synthèse comparative

| Critère | Option A | Option B | Option C |
|---|---|---|---|
| Modification de composants | 1 (`CandidateCard`) | 1 (`AssistantZone`) | 3 (`WorkspaceClient`, `AssistantZone`, `CandidateCard`) |
| Nouvel état partagé | Non | Non | Oui (`selectedCandidate`) |
| Contact avec `createPart` | Via nouvelle action serveur | Via nouvelle action serveur | Via nouvelle action serveur |
| Risque de régression | Faible | Faible | Moyen |
| Couplage | Faible | Faible | Moyen |

**Contrainte identifiée pour toutes les options :** `createPart` est une action serveur protégée (rôle ADMIN) et requiert `partNumber` + `name`. Aucune action serveur `convertCandidateToPart` n'existe encore ; elle doit être créée (hors scope de ce rapport). Un candidat fournit `name` mais pas `partNumber` ni de fichier 3D natif (`fileUrl` est optionnel dans `SearchCandidate`).

---

## §6 Modules isolés et points de contact

### Modules isolés (modifiables sans régression identifiée)
- `src/components/workspace/CandidateCard.tsx` : composant présentatif, props typées, aucun effet de bord.
- `src/components/workspace/AssistantZone.tsx` : consomme `result`, affiche messages + cartes. Pas de logique métier persistante.
- `src/components/workspace/WorkspaceClient.tsx` : orchestre les zones, état `result` local. Aucun effet de bord externe hors `/api/engine`.

### Points de contact avec `createPart` et `/api/engine`
- `src/lib/actions/parts.ts:19` — `createPart(formData)` : action serveur, ADMIN uniquement, crée `Part` + `PartImage[]`.
- `src/app/api/engine/route.ts:8` — route `/api/engine` (POST), retourne `EngineResult` incluant `search.candidates` et `archive.archivedPartId`.
- `src/lib/data/parts.ts:130` — `createPartWithPtvReference` : alternative de création avec référence PTV et retry.
- `prisma/schema.prisma:77` — modèle `Part` ; `printableModelUrl` et `Attachment` (fileType CAD_*) pour le fichier 3D.

### Données d'un candidat vs besoins d'une pièce
`SearchCandidate` fournit : `id`, `name`, `fileUrl?`, `thumbnailUrl?`, `metadata`. `createPart` exige : `partNumber`, `name`. Une conversion nécessitera donc de combler `partNumber` (absence côté candidat) et, le cas échéant, d'associer le fichier 3D (`printableModelUrl` ou `Attachment` de type CAD).

---

## §7 Conclusion de l'état des lieux

- `createPart` existe, est documenté et isolé (`src/lib/actions/parts.ts`), mais réservé aux ADMIN et exige `partNumber` obligatoire.
- Le schéma Prisma offre `Part.printableModelUrl` et la relation `Part.attachments` (types CAD_STL/CAD_STEP/CAD_OBJ) pour stocker un fichier 3D.
- `CandidateCard`, `AssistantZone`, `WorkspaceClient` sont isolés et modifiables sans régression ; aucun bouton de conversion ni état `selectedCandidate` n'existe aujourd'hui.
- Trois options d'implémentation sont cartographiées (A, B, C) avec faisabilité, risque et impact.

### Arrêt
Conformément à la consigne, aucune implantation n'est proposée et aucun code n'a été modifié. Le superviseur dispose désormais des éléments pour choisir et proposer l'implantation E74-A (ou une autre option) en toute connaissance de cause.
