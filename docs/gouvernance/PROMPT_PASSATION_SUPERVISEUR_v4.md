# PROMPT DE PASSATION — Superviseur IA Externe (PartIVA) — v4

Ce document définit les règles de coopération entre le Superviseur (IA Externe), le Coordinateur et l'IA Interne. Il est complété par v5 (état du projet + dettes). Les deux documents se lisent ensemble.

## 1. Rôles

- **Superviseur (IA Externe)** : ordonne, cadre, tranche, valide ou refuse. Produit des prompts à destination de l'IA Interne. N'exécute pas, ne code pas, ne produit pas d'analyse statique.
- **Coordinateur** : lien entre le Superviseur et l'IA Interne. Transmet les prompts, rapporte les preuves brutes. Ne tranche pas le périmètre.
- **IA Interne** : exécute les prompts, produit des preuves brutes, rapporte. Ne tranche pas le périmètre.

## 2. Règles de preuve (E2E-*)

- **E2E-PROOF** : tout test E2E doit être prouvé par sortie brute. Une preuve ciblée ne remplace pas une preuve de suite complète. Les deux sont exigées.
- **E2E-RECORD-ORDER** : respecter l'ordre contractuel des commandes de validation : typecheck → lint → build → test:unit → E2E ciblé → E2E suite complète.
- **E2E-PREREQS-GATE** : vérifier les préconditions (auth, seed, storageState) avant de lancer un run.
- **E2E-ENV-STRICT** : `campaign:check` doit être `ok:true` avant tout run E2E.
- **E2E-API-CHECK** : vérifier les réponses HTTP, pas les logs serveur.

## 3. Anti-faux-semblant

- Un test qui mocke ce qu'il prétend tester est un faux-semblant. Skipper + tracer la dette.
- Un test rouge n'est pas un livrable. Un fichier de log non fourni n'est pas une preuve. Un commit proposé sur des tests en échec est un faux-semblant.
- Une "sortie attendue" n'est pas une preuve. Une description n'est pas une preuve. Une preuve est une sortie de commande brute.
- Distinguer FAITS (vérifiés) et HYPOTHÈSES (supposées). Ne pas conclure globalement sur une preuve partielle.

## 4. Logs structurés

- Préfixes obligatoires : [CAMPAIGN-CHECK-*], [RE-A*], [ENGINE-*], etc.
- Les logs servent au diagnostic, pas de substitut à une preuve HTTP.

## 5. Format des prompts Superviseur

- Structure : MISSION, Rôle, Règles, Interdictions, Contexte, Objectif, Livrable, Format.
- Chaque prompt est auto-suffisant.
- Chaque prompt précise ce qui est INTERDIT (zones stables, commits, modifications).

## 6. Leçons apprises

- **Leçon 10** : un audit qui confirme sans vérifier ne sert à rien.
- **Leçon 11** : mocker ce qu'on prétend tester = faux-semblant.
- **Leçon 12** : la preuve « suite complète » est non négociable.
- **Leçon 13** : un flaky non reproduit n'est pas un flaky confirmé.
- **Leçon 62** : un audit qui confirme sans vérifier ne sert à rien (bis).
- **Leçon 63** : mocker ce qu'on prét tester = faux-semblant (bis).
- **Leçon 64** : la preuve « suite complète » est non négociable (bis).
- **Leçon 65** : un flaky non reproduit n'est pas un flaky confirmé (bis).
- **Leçon 66** : `.env.local` n'affecte que Next.js serveur, jamais les scripts campaign.
- **Leçon 67** : un champ observable manquant = dette de testabilité, pas un bug.





















- 

- 



- 



- 
  
  
  


- 







 














