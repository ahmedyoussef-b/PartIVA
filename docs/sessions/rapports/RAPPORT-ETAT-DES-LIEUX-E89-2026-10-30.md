# Rapport d'État des Lieux Ciblé — E89 : Bouton « Analyser avec le Workspace » dans `/admin/demandes/[id]`

**Date :** 2026-10-30  
**Phase :** E89-0 (audit technique préalable)  
**Objet :** Analyse technique ciblée de la page `/admin/demandes/[id]`, des données `Request`, du moteur `runEngine` et des mécanismes d'intégration sans modification de code applicatif.  
**Statut :** Complété avec preuves de code  

---

## 1. Page Cible — `/admin/demandes/[id]`

### 1.1 Chemin exact des fichiers
- **Server Component (Page route)** : [`src/app/admin/demandes/[id]/page.tsx`](file:///f:/PartIVA/src/app/admin/demandes/[id]/page.tsx)
- **Client Component (Détail et interactions)** : [`src/app/admin/demandes/[id]/demande-detail-client.tsx`](file:///f:/PartIVA/src/app/admin/demandes/[id]/demande-detail-client.tsx)

### 1.2 Structure actuelle
- **`page.tsx`** : Server Component configuré avec `export const dynamic = 'force-dynamic';`. Il récupère l'identifiant via `params`, appelle `getRequestById(id)` dans [`src/lib/data/requests.ts`](file:///f:/PartIVA/src/lib/data/requests.ts) et transmet `initialRequest` au composant client `DemandeDetailClient`.
- **`demande-detail-client.tsx`** : Client Component (`'use client'`). Il normalise la demande via `mapRequestToUi(initialRequest)` ([`src/lib/utils/request-mappers.ts`](file:///f:/PartIVA/src/lib/utils/request-mappers.ts)), et gère les mutations d'état (statut et urgence) via Server Actions dans des transitions React `useTransition`.
- **Layout de la page** :
  1. En-tête : Lien retour (`/admin/demandes`), ID court en police mono, dropdowns d'urgence et statut, boutons d'action principaux.
  2. Carte `PipelineStepper` affichant le statut actuel dans le cycle de fabrication.
  3. Grille 2 colonnes (`lg:grid-cols-3`) :
     - Colonne principale (2/3) : Carte « Cahier des Charges Pièce » + Carte « Photos & Documents Reçus ».
     - Colonne latérale (1/3) : Carte « Coordonnées du Client » + Carte « Prochaine Action Recommandée ».

### 1.3 Emplacement naturel pour insérer le bouton d'action
Deux emplacements privilégiés ressortent de la structure actuelle :
1. **Emplacement primaire (Barre d'actions supérieure)** : Dans le conteneur flex d'actions à la ligne 137 de `demande-detail-client.tsx`, directement aux côtés des boutons existants « Lancer Recherche Multi-Sources » et « Bascule Reverse CAO ».
2. **Emplacement secondaire (Carte Prochaine Action Recommandée)** : Dans la carte latérale (lignes 272–288) comme alternative ou complément d'action directe.

### 1.4 Extrait de code pertinent (`src/app/admin/demandes/[id]/demande-detail-client.tsx`, l. 131–153) :
```tsx
            <p className="text-sm text-muted-foreground">
              Reçue de {request.client.company || request.client.name} le{' '}
              {formatDate(request.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/demandes/${request.id}/recherche`}>
              <Button className="gap-2 font-bold shadow-sm">
                <Search className="h-4 w-4" />
                Lancer Recherche Multi-Sources
              </Button>
            </Link>
            <Link href={`/admin/reverse-engineering/${request.id}`}>
              <Button variant="outline" className="gap-2 font-semibold">
                <Wrench className="h-4 w-4" />
                Bascule Reverse CAO
              </Button>
            </Link>
          </div>
        </div>
      </div>
```

---

## 2. Données de la Demande

### 2.1 Modèle Prisma `Request`
Extrait de [`prisma/schema.prisma`](file:///f:/PartIVA/prisma/schema.prisma) (l. 331–351) :
```prisma
model Request {
  id                String                      @id @default(cuid())
  clientId          String?
  machineRef        String?
  partDescription   String
  partFunction      String?
  suspectedMaterial String?
  quantity          Int                         @default(1)
  urgency           UrgencyLevel                @default(MEDIUM)
  status            RequestStatus               @default(PENDING)
  photos            Json?
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  client            User?                       @relation("UserRequests", fields: [clientId], references: [id])
  projects          ReverseEngineeringProject[] @relation("RequestToReverseEngineeringProject")

  @@index([status])
  @@index([clientId])
  @@index([urgency])
  @@map("requests")
}
```

### 2.2 Stockage et accessibilité des fichiers
- Le champ `photos` est de type `Json?`. Il stocke un tableau de chaînes d'URLs Cloudinary ou d'objets `{ url: string, tag: string }` uploadés côté serveur dans [`src/lib/actions/requests.ts`](file:///f:/PartIVA/src/lib/actions/requests.ts#L88-L94).
- `mapRequestToUi` ([`src/lib/utils/request-mappers.ts`](file:///f:/PartIVA/src/lib/utils/request-mappers.ts#L51-L58)) normalise ce champ en `Array<string | { url: string; tag: string }>`.
- Il n'y a pas de relation avec le modèle `Attachment` sur `Request` (ce dernier est rattaché à `Part`). Les fichiers 3D/CAO ou photos d'une demande sont donc référencés directement par leurs URLs HTTPS Cloudinary dans `photos`.

---

## 3. Signature et Contrat de `runEngine`

### 3.1 Fichier d'entrée et d'export
- Orchestrateur central : [`src/core/ai-engine/engine.ts`](file:///f:/PartIVA/src/core/ai-engine/engine.ts)
- Types d'entrée : [`src/core/ai-engine/skills/ingest/types.ts`](file:///f:/PartIVA/src/core/ai-engine/skills/ingest/types.ts)

### 3.2 Signature exacte
```typescript
// Extrait de src/core/ai-engine/engine.ts (l. 19-22)
export async function runEngine(
  input: IngestInput,
  options?: { mode?: 'quick' | 'deep' },
): Promise<EngineResult>
```

### 3.3 Extrait des types d'entrée et de retour
```typescript
// Extrait de src/core/ai-engine/skills/ingest/types.ts (l. 11-16)
export type IngestInput = {
  photos?: (File | string)[];
  cadFiles?: (File | string)[];
  dimensions?: Dimensions;
  description?: string;
};

// Extrait de src/core/ai-engine/engine.ts (l. 12-17)
export type EngineResult = {
  ingest: IngestResult;
  search: SearchResult;
  reconstruct: ReconstructResult;
  archive: ArchiveResult;
};
```

### 3.4 Comportement asynchrone et dépendances
- **Asynchronisme** : Fonction asynchrone retournant une promesse unique sans streaming HTTP (`Promise<EngineResult>`).
- **Durée** : ~1s en mode `quick` (recherche locale SQLite/Postgres uniquement) ; ~3–8s en mode `deep` si analyse Groq Vision et requêtes web externes.
- **Dépendances directes** :
  - Groq API (`openai/gpt-oss-120b` pour le texte et `qwen/qwen3.8-27b` pour Vision dans `detectPartType`).
  - Base de données PostgreSQL (Prisma Client pour les candidats et l'archivage).
  - OpenSERP / TraceParts (optionnel si web search activé).

---

## 4. Skills et Dépendances

### 4.1 Les 4 Skills orchestrés séquentiellement
1. **Ingest (`skills/ingest`)** : Point d'entrée `ingestInput(input)`. Extrait formats, tailles, dimensions, et appelle Groq Vision (`detectPartType`) si des URLs de photos sont transmises.
2. **Search (`skills/search`)** : Point d'entrée `searchParts({ ingestResult, mode, threshold, maxResults })`. Recherche les pièces similaires dans la base locale (`searchLocal`), complétée par `searchWeb` si moins de 3 candidats exploitables en mode `deep`.
3. **Reconstruct (`skills/reconstruct`)** : Point d'entrée `reconstructPart({ ingestResult, searchResult })`. Tente de sélectionner un modèle 3D exploitable ou génère un modèle paramétrique de repli (`method: 'generated'`).
4. **Archive (`skills/archive`)** : Point d'entrée `archivePart({ ingestResult, searchResult, reconstructResult })`. Valide la conformité (`validateArchive`) et insère une entrée `Part` avec statut `DRAFT` via Prisma (`partNumber = AUTO-${Date.now()}`).

### 4.2 Contraintes d'exécution côté serveur
- **Runtime requis** : **Node.js** (`runtime = 'nodejs'`). Incompatible avec le runtime Edge en raison de Prisma Client, de l'accès aux variables d'environnement système et des bibliothèques de manipulation de données.

---

## 5. Mécanisme d'Action Existant

### 5.1 Actions existantes dans l'administration
- **Server Actions** dans [`src/lib/actions/requests.ts`](file:///f:/PartIVA/src/lib/actions/requests.ts) :
  - `updateRequestStatus(input)` (l. 221–243) : Met à jour `Request.status` via Prisma et revalide `/admin/demandes`, `/admin/demandes/[id]`.
  - `updateRequestUrgency(input)` (l. 250–272) : Met à jour `Request.urgency` via Prisma.
- **Route API existante dédiée au moteur** :
  - [`src/app/api/engine/route.ts`](file:///f:/PartIVA/src/app/api/engine/route.ts) : Route `POST` recevant `{ photos, cadFiles, dimensions, description, mode }`, exécutant `runEngine`, enrichissant la description avec Groq si nécessaire, et consignant la recherche dans `SearchHistory`.

### 5.2 Patterns réutilisables dans l'UI
- **`useTransition`** : Utilisé dans `demande-detail-client.tsx` pour gérer `isPending` sans bloquer le rendu (`const [isPending, startTransition] = useTransition();`).
- **Toasts Sonner** : Utilisés dans toute l'application (`toast.success(...)`, `toast.error(...)`).
- **Fetch direct** : Utilisé dans `WorkspaceClient.tsx` (l. 57–68) pour interroger `/api/engine`.

---

## 6. Authentification & Permissions

### 6.1 Protection de la route `/admin/demandes/[id]`
1. **Middleware / Proxy** ([`src/proxy.ts`](file:///f:/PartIVA/src/proxy.ts#L64-L71)) :
   ```typescript
   if (pathname.startsWith('/admin')) {
     if (!session) {
       return NextResponse.redirect(new URL('/login', request.url));
     }
     if (role !== 'ADMIN') {
       return NextResponse.redirect(new URL('/client', request.url));
     }
   }
   ```
2. **Layout Admin** ([`src/app/admin/layout.tsx`](file:///f:/PartIVA/src/app/admin/layout.tsx#L59-L65)) :
   Vérifie que l'utilisateur possède le rôle `ADMIN` (ou token actif sous Tauri) ; sinon, affiche un écran d'accès restreint bloquant tout accès au contenu.

### 6.2 Contraintes pour une nouvelle action ou route API
- Toute nouvelle Server Action ou endpoint API devra valider la session active via BetterAuth (`auth.api.getSession`) ou `getCurrentUser()` ([`src/lib/auth-server.ts`](file:///f:/PartIVA/src/lib/auth-server.ts)) et rejeter la requête si `role !== 'ADMIN'`.

---

## 7. Stockage des Résultats

### 7.1 Persistance actuelle du Workspace
- Côté client : Persistance dans le `localStorage` sous la clé `'partiva-workspace-state'` via [`src/lib/hooks/use-workspace-persistence.ts`](file:///f:/PartIVA/src/lib/hooks/use-workspace-persistence.ts).
- Côté serveur : `runEngine` persiste immédiatement une pièce brouillon `Part` via `archivePart` dans Prisma.

### 7.2 Champ `analysisData` dans les modèles Prisma
- **Vérification** : Le modèle `Part` ([`prisma/schema.prisma`](file:///f:/PartIVA/prisma/schema.prisma#L79-L112)) et le modèle `Request` ([`prisma/schema.prisma`](file:///f:/PartIVA/prisma/schema.prisma#L331-L351)) **ne possèdent aucun champ `analysisData`**.
- **Périmètre E89 vs E90** :
  - **En E89** : Le résultat de l'analyse doit rester transitoire (affichage immédiat dans un tiroir/dialogue, ou redirection vers le workspace pré-alimenté via `localStorage` / URL / state).
  - **En E90** : Ajout formel de la persistance en base de données (migration Prisma pour `analysisData Json?`, stockage et relecture de l'historique d'analyse).

---

## 8. Tests Existants

### 8.1 Tests Unitaires (Vitest)
- **Localisation** : `src/core/ai-engine/skills/**/*.test.ts`
- **Résultat actuel** : **8 suites de tests, 31 tests passants** (`npm run test:unit` → EXIT 0).
  - `validate.test.ts` (Archive) : 2 tests
  - `select-candidates.test.ts` (Reconstruct) : 2 tests
  - `search.test.ts` (Search) : 2 tests
  - `generate-cad.test.ts` (Reconstruct) : 14 tests
  - `generate-composite.test.ts` (Reconstruct) : 1 test
  - `extract-params.test.ts` (Reconstruct) : 3 tests
  - `ingest.test.ts` (Ingest) : 4 tests
  - `reconstruct.test.ts` (Reconstruct) : 3 tests

### 8.2 Tests End-to-End (Playwright)
- **Localisation** : `e2e/workspace/workspace.spec.ts` (17 tests passants pour le workspace) et `e2e/admin/` (tests admin).
- **Extension pour E89** : Il conviendra d'ajouter un test E2E vérifiant la présence du bouton « Analyser avec le Workspace » sur `/admin/demandes/[id]`, son déclenchement, et la restitution visuelle des résultats ou la navigation associée.

---

## 9. Risques et Points de Friction Identifiés

1. **Extraction des photos pour `IngestInput`** :
   Dans `Request`, `photos` est un champ Json pouvant contenir des objets `{ url: string, tag: string }` ou des chaînes simples. `runEngine` attend `photos?: (File | string)[]`. Il faudra veiller à extraire uniquement les URLs (`p.url || p`) pour éviter des rejets par le validateur Zod `ingestInputSchema`.
2. **Gestion des délais / timeouts (dette D-E56-ENGINE-ERROR-HANDLING)** :
   L'appel à `runEngine` peut durer plusieurs secondes si Groq Vision ou la recherche web sont sollicités. L'interface du bouton doit impérativement afficher un état de chargement (`disabled`, spinner) pour éviter les double-clics ou un sentiment de gel de l'application.
3. **Comportement en cas d'échec du moteur** :
   En cas d'erreur de parsing ou d'indisponibilité réseau, `runEngine` renvoie un objet avec `analysisStatus: 'failed'` ou `warnings: ['engine_failed']`. L'UI de la page admin ne doit pas planter et doit afficher un message explicatif clair (toast ou alerte).
4. **Préservation des flux stables** :
   Aucun composant interne du workspace (`WorkspaceClient.tsx`, `ViewerZone.tsx`, etc.) ni la logique de `runEngine` ne doivent être altérés pour E89. L'ajout doit être strictement circonscrit à l'interface d'administration de la demande et à son contrôleur d'action.

---

**Fin du rapport d'audit E89-0. Arrêt effectué conformément aux instructions.**
