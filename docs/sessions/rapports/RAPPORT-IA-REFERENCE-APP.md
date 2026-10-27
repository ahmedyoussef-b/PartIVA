# RAPPORT-IA-REFERENCE-APP

## §1 — Inventaire des intégrations IA

### Appels APIs externes
- Groq (LLM) : `docs/app/src-tauri/src/groq_stream.rs`, `docs/app/src/lib/ai/groq-client.ts`, `docs/app/src/lib/ai/groq-error-mapping.ts`
- Cloudflare Embeddings : `docs/app/src/lib/ai/cloudflare-embeddings.ts`, `docs/app/src-tauri/src/embeddings.rs`
- Configuration IA : `docs/app/src/lib/ai/config.ts` (lecture/écriture config Tauri)

### Bibliothèques IA
- FastEmbed (Rust/ONNX, all-MiniLM-L6-v2) : `docs/app/src-tauri/.fastembed_cache/`, `docs/app/src-tauri/src/vectorizer.rs`, `vectorizer_tree.rs`
- Transformers/Xenova non détectés côté web ; embeddings via service Rust.

### Composants UI dédiés IA
- Chat IA : `docs/app/src/app/(dashboard)/chat-ia/page.tsx`, `docs/app/src/components/qr/ChatInput.tsx`, `ChatMessage.tsx`, `ConversationSidebar.tsx`, `SourceCard.tsx`
- Actions IA : `docs/app/src/app/(dashboard)/actions-ia/page.tsx`
- Assistant vocal : `docs/app/src/components/ui/speech-controls.tsx`, `docs/app/src/components/voice/voice-controls.tsx`, `docs/app/src/hooks/use-voice-assistant.ts`, `docs/app/src/lib/speech/*`
- Visualisation/vectorisation : `docs/app/src/components/admin/VectorizationTab.tsx`

### Routes API IA
- `docs/app/src/app/api/ai/chat/route.ts`
- `docs/app/src/app/api/ai/rag/route.ts`
- `docs/app/src/app/api/ai/embed/route.ts`
- `docs/app/src/app/api/implante/analyze/route.ts`, `generate/route.ts`, `deploy/route.ts`
- `docs/app/src/app/api/pipeline/generate-context/route.ts`

### Services IA
- `docs/app/src/lib/ai/rag-search.ts`, `rag-prompts.ts`, `prompts.ts`, `query-cleaning.ts`, `types.ts`, `use-ai-chat.ts`
- `docs/app/src/services/rag-stream.ts`, `local-rag.ts`, `docs/app/src/services/conversation-store.ts`

### Modèles Prisma IA
- `DocumentChunk` avec `embedding Unsupported("vector(384)")` dans `docs/app/prisma/schema.prisma`
- Migrations : `prisma/migrations/20260929090536_add_document_chunk/migration.sql`, `20261001070000_add_document_chunks_hnsw_index/migration.sql`, `20261003111537_add_hybrid_search_tsvector/migration.sql`

## §2 — Patterns réutilisables

- Configuration IA centralisée via config Tauri (`getConfig`/`saveConfig`/`resetConfig`) + flag `setup_completed`.
- Appels LLM encapsulés dans `groq-client.ts` et streaming via `rag-stream.ts` (`isTauriEnv`).
- RAG : découpage en chunks (`DocumentChunk`), embeddings vector(384), index HNSW, recherche hybride tsvector + vector.
- Prompts centralisés dans `prompts.ts` et `rag-prompts.ts`.
- Nettoyage de requête (`query-cleaning.ts`) avant recherche.
- Gestion d'erreurs Groq via `groq-error-mapping.ts`.
- Hook React `use-ai-chat.ts` pour consommer le chat.
- Guard authentification via `auth-guard.ts` pour routes API.

## §3 — Composants UI réutilisables

- Chat : `ChatInput`, `ChatMessage`, `ConversationSidebar`, `SourceCard` (`docs/app/src/components/qr/`)
- Voix : `speech-controls`, `voice-controls`, `use-voice-assistant`, `use-speech`, `voice-commands`
- Admin vectorisation : `VectorizationTab`
- Pages : `chat-ia`, `actions-ia`

## §4 — Modèles Prisma et schémas liés à l'IA

- `DocumentChunk` : content, embedding vector(384), metadata JSON, chunkIndex, source, timestamps.
- Index HNSW sur embedding (migration).
- Colonne tsvector pour recherche hybride (migration).
- Pas de table Conversation/Message dans le schéma Prisma fourni (stockage via `conversation-store.ts`).

## §5 — Recommandations pour PartIVA

- Réutiliser la structure `src/lib/ai/*` (config, client, prompts, rag-search, types, use-ai-chat) pour `src/core/ai-engine/`.
- Adopter le modèle `DocumentChunk` + migrations pgvector pour le RAG.
- Garder le pattern d'encapsulation des appels LLM et le streaming.
- Réutiliser les composants `qr/*` pour le workspace chat.
- Conserver la guard auth sur routes API et la config centralisée.
- Adapter les dépendances Tauri (invoke) si le workspace n'est pas Tauri ; prévoir abstraction.
