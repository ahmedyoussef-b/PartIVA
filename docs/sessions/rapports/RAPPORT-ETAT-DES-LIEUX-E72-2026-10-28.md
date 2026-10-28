# RAPPORT-ETAT-DES-LIEUX-E72 — Chat Interactif

## §1 AssistantZone
Affichage statique des résultats, pas de saisie.

## §2 Composants chat
ChatInput existe. use-ai-chat.ts appelle /api/ai/chat (route absente) et Tauri RAG.

## §3 groq-client
callGroq messages, getGroqApiKey. Contexte non passé actuellement.

## §4 Route API
Aucune route /api/ai/chat.

## §5 Options
A: utiliser use-ai-chat + créer route. B: hook dédié. C: intégrer dans AssistantZone. Option A recommandée.

## §6 Modules isolés
AssistantZone, ChatInput isolés. Points de contact WorkspaceClient et /api/engine.

## §7 Conclusion
Implémentation via route + contexte résultats.
