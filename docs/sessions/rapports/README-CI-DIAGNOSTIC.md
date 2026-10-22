# README — Diagnostic CI E26-bis-C (à distribuer à l'utilisateur)

Voici le contenu du workflow courant, tel que lu localement (branch `master` → commit `77a3360`):

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
```

**Aucun `registry-url`, aucun `scope`, aucun token** n'est défini dans le bloc `setup-node`.

---

## Ce que cela signifie

- `setup-node` ne configure **pas** d'authentification vers `registry.npmjs.org`
- Le `.npmrc` du projet (racine) est valide : `auto-install-peers=true`, `strict-peer-dependencies=false`
- `package-lock.json` est présent et cohérent (aucune URL privée)

=> Le 401 n'est **pas** causé par `registry-url` + secret manquant.

---

## Causes résiduelles à examiner

|Cause|Comment vérifier|
|---|---|
|Rate limit npm|Log du run : `erie limited` ou `429 Too Many Requests`|
|Version node incohérente|Workflow : `NODE_VERSION: '22'` ; vérifier `.nvmrc` / `.node-version`|
|Dépendance incompatible|Log : `ERESOLV` ou `ERESOLVE unable to resolve dependency tree`|
|Corruption cache npm|Log : `npm ci` échoue mais `npm install` réussit|

## Prochaines actions demandées

1. **Afficher les logs du run échoué** via `gh run view 39686802829 --log-failed` et copier les **10 lignes autour de la première erreur** (`npm error ...`).
2. **Confirmer** s'il y a des secrets supplémentaires dans le workflow (rechercher `$ {{ secrets... }}`).
3. **Réessayer** si possible : `gh run rerun 39686802829 --failed`.
4. Si le problème persiste, **contacter l'administrateur du dépôt** pour vérifier l'état du registry npm et la configuration des runners (`ubuntu-latest`).

---

*Document généré automatiquement après l'analyse de l'échec CI.*
