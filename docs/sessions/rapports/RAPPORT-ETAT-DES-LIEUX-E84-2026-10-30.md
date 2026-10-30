# Rapport d'État des Lieux Ciblé — E84 : IA Générative d'Images

**Date :** 2026-10-30  
**Objet :** Évaluation des capacités, dépendances, contraintes et options réalistes pour la génération d'images par IA dans PartIVA  
**Statut :** Préalable E84 — Audit technique sans modification de code applicatif  

---

## 1. Audit des Fournisseurs d'IA Existants

### 1.1 Fichier source : `src/lib/ai/providers.ts`
L'infrastructure actuelle d'IA repose sur l'interface unifiée `AIProvider` :

```typescript
// Extrait de src/lib/ai/providers.ts (l. 39-51)
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  id: string;
  name: string;
  isAvailable: boolean;
  tier: 'free' | 'paid';
  isPaid: boolean;
  chat(messages: AIMessage[], context?: unknown): Promise<string>;
}
```

### 1.2 Analyse de `GroqProvider`
- **Implémentation** : `GroqProvider` (l. 53-66) fait appel à `callGroq` via `src/lib/ai/groq-client.ts`.
- **Modèle sous-jacent** : Modèles de langage textuels (LLM type Llama 3 / Mixtral via API Groq LPU).
- **Capacités de génération d'images** : **Aucune**. L'API Groq est strictement dédiée à l'inférence ultra-rapide de modèles de langage textuels et de transcription audio (Whisper). Groq ne propose aucun endpoint Text-to-Image (DALL-E, Stable Diffusion ou FLUX).

### 1.3 Analyse de `ClaudeProvider`
- **Implémentation** : `ClaudeProvider` (l. 9-37) utilise le SDK `@anthropic-ai/sdk` ciblant `claude-haiku-4-5`.
- **Capacités de génération d'images** : **Aucune**. Les modèles Claude (Anthropic) sont des modèles multimodaux en entrée (vision / analyse d'images fournie par l'utilisateur), mais strictement textuels en sortie (texte, markdown, code). Anthropic ne dispose d'aucune API génératrice d'images.

### 1.4 Conclusion fournisseurs
Aucun des fournisseurs configurés ou préparés dans PartIVA ne supporte la génération d'images en sortie. L'interface `AIProvider.chat` retourne exclusivement un `Promise<string>`.

---

## 2. Audit des Services Externes et Dépendances

### 2.1 Configuration d'environnement (`.env`)
L'audit complet des variables d'environnement dans [`.env`](file:///f:/PartIVA/.env) révèle :
- **OpenAI (DALL-E)** : Aucune variable (`OPENAI_API_KEY` absente).
- **Stability AI (Stable Diffusion)** : Aucune variable (`STABILITY_API_KEY` absente).
- **Replicate** : Aucune variable (`REPLICATE_API_TOKEN` absente).
- **Hugging Face** : 
  - Présence de :
    ```env
    HF_API_URL=http://localhost:7860/v1/embeddings
    HF_API_TOKEN=  # Pas besoin de token, laisser vide
    HF_EMBEDDING_MODEL=siglip-base-patch16-256-multilingual
    ```
  - **Usage réel** : Ces variables sont strictement dédiées au service d'embeddings vectoriels de recherche multimodale ([`src/lib/embeddings.ts`](file:///f:/PartIVA/src/lib/embeddings.ts)), et non à la génération Text-to-Image.
- **Stockage média** : Cloudinary (`CLOUDINARY_API_KEY`, etc.) et Vercel Blob (`BLOB_READ_WRITE_TOKEN`) sont configurés pour l'hébergement de fichiers statiques/uploads, pas pour la génération.

### 2.2 Dépendances du projet (`package.json`)
L'inspection de [`package.json`](file:///f:/PartIVA/package.json) confirme :
- `@huggingface/inference` : **Absent**.
- `@xenova/transformers` : **Absent** (non installé).
- `openai` SDK : **Absent**.
- `replicate` SDK : **Absent**.
- Dépendances IA présentes : uniquement `@anthropic-ai/sdk` (^1.3.0).

---

## 3. Contexte d'Utilisation dans l'Application

### 3.1 Emplacements d'affichage potentiels
1. **`AssistantZone` ([`src/components/workspace/AssistantZone.tsx`](file:///f:/PartIVA/src/components/workspace/AssistantZone.tsx))** :
   - Zone de chat interactive et d'affichage des résultats du pipeline IA (`EngineResult`).
   - L'image générée pourrait s'afficher sous forme d'une carte visuelle (illustration conceptuelle de la pièce ou schéma de réparation) au sein du flux de messages ou dans une section dédiée.
2. **`ViewerZone` ([`src/components/workspace/ViewerZone.tsx`](file:///f:/PartIVA/src/components/workspace/ViewerZone.tsx))** :
   - Dédié au rendu géométrique 3D interactif (Three.js / Canvas via `CadViewer` ou `ModelViewer`). L'affichage d'un bitmap 2D généré par IA dans cette zone entrerait en conflit avec l'expérience 3D interactive et les outils de mesure dimensionnelle.
3. **`CandidateCard` ([`src/components/workspace/CandidateCard.tsx`](file:///f:/PartIVA/src/components/workspace/CandidateCard.tsx))** :
   - Affiche les vignettes des pièces trouvées dans le catalogue. Une image générée n'a pas vocation à remplacer une pièce standard certifiée.

### 3.2 Cas d'usage et pertinence industrielle
- **Utilité attendue** : Fournir une vue d'artiste ou une reconstitution visuelle d'une pièce industrielle manquante ou endommagée.
- **Limites techniques majeures** : Les modèles de diffusion génératifs d'images (DALL-E 3, SDXL, Midjourney) produisent des rendus approximatifs, sans cotes dimensionnelles réelles, sans tolérances d'usinage, et souvent incompatibles avec les réalités de la CAO industrielle.

---

## 4. Cartographie des Options Réalistes

| Critère | Option A : Service externe payant (DALL-E / Stability) | Option B : Modèle open-source local (Transformers / SD) | Option C : Report officiel de la fonctionnalité | Option D : Alternative textuelle via Groq |
| :--- | :--- | :--- | :--- | :--- |
| **Description** | Appel API REST vers OpenAI DALL-E 3 ou Stability AI | Exécution locale de Stable Diffusion via ONNX/WebGPU ou serveur Python | Déclarer E84 hors périmètre du MVP gratuit | Générer une description technique détaillée ou spécification visuelle via Groq |
| **Faisabilité** | **Faible** (exige CB, compte payant externe, clés hors contrat) | **Nulle / Non viable** (modèle 2-5 Go, crash mémoire navigateur/Node, VRAM requise) | **Immédiate** (0 développement superflu) | **Haute** (utilise l'infrastructure Groq déjà en place et validée) |
| **Coût financier** | Payant (0.04$ à 0.08$ / image générée) | Gratuit en licence mais coût machine prohibitif | Gratuit (0 €) | **Gratuit (0 €)** (inclus dans Groq gratuit) |
| **Risques** | Dépendance externe payante, rupture du principe de gratuité totale de PartIVA | Instabilité du serveur, lenteurs majeures (>2 min/image), échec build Vercel | Aucun risque | Risque quasi-nul, pas de régression |
| **Impact flux stables**| Faible (nouvel endpoint) mais bloquant côté exécution sans clé | Très élevé (surcharge bundle, blocage CI/CD) | **Nul** | **Nul** (extension de prompts dans `AssistantZone`) |

---

## 5. Identification des Modules Isolés

- **`AssistantZone` (`src/components/workspace/AssistantZone.tsx`)** :
  - Composant entièrement modulaire et encapsulé.
  - Reçoit des données en lecture seule via ses props (`result`, `status`, `error`).
  - Toute modification de l'interface d'assistance n'affecte ni `ViewerZone`, ni le moteur géométrique (Manifold / OpenCascade), ni l'authentification.
- **Route API `src/app/api/ai/chat/route.ts`** :
  - Isolé pour le traitement textuel, extensible sans casser les autres routes API.

---

## 6. Synthèse et Recommandation Technique

1. **Constat technique net** : Ni Groq ni Claude ne savent générer d'images. Aucune clé d'API de génération d'image n'est présente dans l'environnement. L'exécution d'un modèle d'image localement (Option B) est irréaliste pour l'architecture web/serverless de PartIVA.
2. **Recommandations** :
   - **Option recommandée par défaut** : **Option D** (Génération d'une fiche descriptive technique de la pièce ou prompt de rendu assisté via Groq dans `AssistantZone`) OU **Option C** (Report officiel documenté au registre des décisions, considérant qu'un outil de CAO industrielle privilégie les modèles 3D exacts aux images d'artistes 2D).
3. **Arrêt strict** : Aucune modification de code ni implantation n'a été réalisée à ce stade, dans le respect des directives du Superviseur.
