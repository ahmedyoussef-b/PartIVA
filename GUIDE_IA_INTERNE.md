# GUIDE IA INTERNE — PartIVA

**Destinataire :** IA interne (Kilo Code, Cursor, Claude Code, ou autre).
**Objet :** Instructions du Superviseur vers l'IA interne.

---

## 0. Comment utiliser ce guide

À chaque nouvelle session, lis **dans cet ordre** :

1. `CONTEXT.md` — snapshot de l'état actuel.
2. `GUIDE_IA_INTERNE.md` (ce fichier).
3. Le prompt de la sous-étape en cours (fourni par le Superviseur).

**Une fois ces fichiers lus, tu es prêt.**

---

## 1. Règles absolues

1. **PAS de `schedule_wakeup`.**
2. **PAS de boucle.** Chaque commande = une exécution = une sortie collée. Si tu écris 3 fois la même phrase sans exécuter → **STOP**, le Superviseur va te débloquer.
3. **PAS d'hallucination.** Si tu n'es pas sûr, **lis le fichier** (`Get-Content`) avant de répondre. Ne jamais inventer un contenu.
4. **PAS de modification non ordonnée.** Tu ne modifies **que** les fichiers listés dans le prompt en cours.
5. **PAS de réinitialisation.** Tu ne fais jamais `git reset`, `git checkout -- .`, ou `Move-Item src/app/api src/app/api.bak` sans ordre explicite.

---

## 2. Protocoles d'audit

Le Superviseur peut te demander un **audit**. Voici les formats attendus.

### 2.1 Audit d'un fichier

**Prompt type :**
> "Audit de `src/lib/data-client.ts` : liste les fonctions exportées, leur signature, et si elles utilisent `invoke` ou `fetch`."

**Réponse attendue :**
```markdown
# AUDIT — src/lib/data-client.ts

## Fonctions exportées
- `getMaterials()` : `invoke('get_materials')` + fallback `fetch('/api/materials')`
- `getDashboard()` : ...
- ...

## Verdict
[Ce qui est conforme, ce qui ne l'est pas]
```

### 2.2 Audit d'une fonctionnalité

**Prompt type :**
> "Audit du flux de demande : de la création à l'affichage dans `/admin/demandes`. Liste les fichiers impliqués, les appels `fetch`/`invoke`, et les points de rupture."

**Réponse attendue :**
```markdown
# AUDIT — Flux de demande

## Fichiers impliqués
1. `src/app/admin/demandes/page.tsx` — Server Component
2. `src/lib/data/requests.ts` — Prisma direct
3. `src/app/api/demandes/route.ts` — API REST

## Flux
[Diagramme ou liste ordonnée]

## Points de rupture
- ❌ `page.tsx` est Server Component → incompatible `export`
- ❌ `data/requests.ts` utilise Prisma direct → pas d'`invoke`

## Recommandations
[Ce qu'il faut convertir]
```

### 2.3 Audit global

**Prompt type :**
> "Audit global de l'état E9-R7 : liste les pages admin, leur type (Server/Client), leur source de données, et les bloquants pour le build `export`."

**Réponse attendue :**
```markdown
# AUDIT GLOBAL — E9-R7

## Pages admin (15)
[Tableau : page, type, source, bloquant export]

## Routes API (30+)
[Liste, bloquant export]

## dataClient
[État]

## Bloquants pour `export`
[Liste]

## Recommandations
[Plan de conversion]
```

### 2.4 Audit d'un flux

**Prompt type :**
> "Audit du flux de sync : de `sync_now` à l'affichage des données. Liste les fichiers, les appels, et les points de rupture."

**Réponse attendue :**
```markdown
# AUDIT — Flux de sync

## Étapes
1. Bouton "Sync Cloud" → `invoke('sync_now')`
2. `sync.rs::sync_all()` → API web `/api/desktop/sync/*`
3. Upsert dans SQLite local
4. `invoke('get_materials')` → lit SQLite

## Points de rupture
- ❌ `SYNC_TABLES` en strings → `material`/`request` non persistés (dette R4b-2a-1)
- ❌ `sync_now` non testé en conditions réelles (dette R5-1)

## Recommandations
[Corrections]
```

---

## 3. Chemins de fichiers à transmettre au Coordinateur

Quand le Superviseur demande un fichier, **donne le chemin exact** (relatif à `F:\PartIVA\`), et **colle le contenu brut**.

**Format :**
```markdown
# FICHIER — src/lib/data-client.ts

**Chemin complet :** `F:\PartIVA\src\lib\data-client.ts`

**Contenu :**
```typescript
[contenu intégral]
```
```

**Ne jamais résumer, ne jamais tronquer** (sauf si le fichier > 500 lignes, alors indiquer `<tronqué à 500 lignes>`).

---

## 4. Rapport de fin de session

À la fin de chaque session, produis un **rapport de session** au format :

```markdown
# RAPPORT — [Session ID]

## Statut
[✅ Succès / ⚠️ Réserve / ❌ Échec]

## Sous-étapes exécutées
[Liste]

## Fichiers modifiés
[Liste avec chemins]

## Vérifications
- `npm run build` : [résultat]
- `cargo test` : [résultat]
- `git status` : [sortie]

## Commit
- Hash : [hash]
- Message : [message]

## Réserves
[Ce qui reste à faire]

## Prochaine étape
[Recommandation]
```

---

## 5. Mise à jour de `CONTEXT.md`

Après chaque session, **mets à jour `CONTEXT.md`** avec :
- Le nouveau commit HEAD.
- La phase en cours.
- Les nouvelles dettes.
- Les décisions prises.

**Format :**
```markdown
# CONTEXT — PartIVA

**Dernière mise à jour :** [date]
**Commit HEAD :** [hash]
**Phase en cours :** [E9-R7]
**Sous-étape :** [4/7]

## État
[Description courte]

## Dettes actives
[Liste]

## Décisions récentes
[Liste]
```