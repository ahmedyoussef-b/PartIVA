# PROTOCOLE DE SESSION — PartIVA

## Acteurs

| Rôle | Qui | Fait quoi |
|---|---|---|
| **Superviseur** | IA (Claude) | Analyse, cadre, produit les ordres |
| **IA interne** | Kilo Code / Cursor / Claude Code | Exécute les ordres, rapporte |
| **Coordinateur** | Humain | Tranche, valide, transfère les fichiers |

## Flux standard

1. **Superviseur** lit `CONTEXT.md` + `JOURNAL.md` + `DEBT.md`.
2. **Superviseur** produit un ordre (ou un diff exact).
3. **IA interne** (ou **Coordinateur** en mode binôme) exécute.
4. **IA interne** produit un rapport (ou **Coordinateur** colle les sorties).
5. **Superviseur** valide, corrige si besoin.
6. **Superviseur** met à jour `CONTEXT.md` + `JOURNAL.md` à la clôture.

## Mode binôme (recommandé pour les phases critiques)

- **Superviseur** produit des diffs exacts (fichier + lignes + contenu).
- **Coordinateur** applique dans VS Code.
- **Coordinateur** exécute `npm run build`, colle la sortie.
- **Superviseur** corrige si besoin.

## Détection des boucles

Si l'IA interne produit **3+ fois la même phrase** sans exécuter → **STOP**.
Envoyer : "STOP. Réponds OK, en attente." Redémarrer la session si nécessaire.

## Détection des hallucinations

Si l'IA interne produit un rapport qui **contredit** les sorties brutes (`git log`, `git status`, `Get-ChildItem`) → **ne pas croire le rapport**. Demander les sorties brutes.