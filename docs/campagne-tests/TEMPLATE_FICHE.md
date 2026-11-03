# Template de fiche de test — Campagne PartIVA

## Métadonnées
- **ID** : E2E-<DOMAINE>-<NN>
- **Domaine** : 
- **Dépend de** : (autre ID ou vide)
- **Date de création** : 
- **Auteur (Superviseur)** : 

## Prérequis
- `npm run campaign:check` → `env-ready.json` ok = true
- Snapshot DB T1 : `docs/campagne-tests/preuves/<ID>/db-snapshot.json`
- StorageState admin valide (`.auth/admin.json`)

## Ce que fait la fonctionnalité
(description concise)

## Flux exact à appliquer
1. 
2. 

## Résultat attendu
(description)

## Critères SUCCESS
- 

## Critères BUG
- 

## Rapport d'exécution (obligatoire)
Fichier : `docs/campagne-tests/preuves/<ID>/RAPPORT.md`

Squelette :
```
# Rapport d'exécution — <ID>

**Date** : <ISO>
**SHA** : <sha7>
**Exécuteur** : Coordinateur humain

## Prérequis
- [x] env-ready.json OK (ou N/A)
- [x] db-snapshot.json T1 joint
- [ ] capture.png (optionnel)

## Étapes exécutées
### Étape 1 — <commande>
Sortie brute :
<sortie>
Exit code : <n>

## Verdict coordinateur
SUCCESS / BUG / INNOVATION (justification 1-3 phrases)

## Artefacts
- db-snapshot.json : <chemin>
- db-snapshot-retest.json : <chemin ou N/A>
- capture.png : <chemin ou "N/A">

## Notes / observations
- 
```

## Capture (optionnel)
Chemin : `docs/campagne-tests/preuves/<ID>/capture.png` (analyse visuelle uniquement)

## Verdict
- [ ] ✅ SUCCÈS / ⚠️ BUG / 💡 INNOVATION / ⏭️ SKIPPED

## Note
(min 20 caractères si forcé)

## Historique
- 
