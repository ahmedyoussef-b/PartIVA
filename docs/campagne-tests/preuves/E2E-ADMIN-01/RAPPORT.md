# Rapport d'exécution — E2E-ADMIN-01

**SHA** : 4abd4db
**Exit code** : 1
**Verdict** : BUG
**Date** : 2026-11-02
**Exécuteur** : Coordinateur humain

## Flux exécuté
1. Connexion admin (hmedyoussefabbes@gmail.com) : OK
2. Accès à /admin/pieces/nouveau : OK
3. Remplissage du formulaire (nom + description + dimensions) : OK
4. Upload d'image pexels-steve.jpg (0.86 MB) : **ÉCHEC**
5. Clic "Créer la pièce" : **pièce créée mais sans image**

## Erreur observée
Message à l'écran : « 1 image(s) n'ont pas pu être uploadées. La pièce a été créée mais sans ces images »
Détail : pexels-steve.jpg: Invalid api_key

## Variables d'environnement vérifiées
Get-Content .env | Select-String "CLOUDINARY" :
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dl8ngmflh ✅
- CLOUDINARY_API_KEY=*** (présente) ✅
- CLOUDINARY_API_SECRET=*** (présente) ✅
- NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default ✅

## Cause probable
L'upload admin utilise un upload signé Cloudinary (api_key + api_secret), contrairement au workspace qui utilise un upload non signé (preset ml_default). L'api_key présente dans .env est peut-être invalide, révoquée, ou mal utilisée dans la signature.

## Dettes tracées
### D-ADMIN-CLOUDINARY-API-KEY (HAUTE)
L'upload d'image admin échoue avec Invalid api_key. Cause probable : clé révoquée ou signature mal générée. Bloque la création de pièces avec images côté admin.

### D-ADMIN-CREATION-PARTIAL (MOYENNE)
La pièce est créée même si l'upload image échoue. L'UX devrait soit bloquer la création (rollback), soit proposer une correction (re-upload image). État actuel : pièce orpheline sans image.

## Dette technique détectée (bonus)
Le workspace utilise un upload **non signé** (preset ml_default), l'admin utilise un upload **signé**. Deux chemins d'upload différents pour la même fonctionnalité Cloudinary. À uniformiser (D-ADMIN-CLOUDINARY-UNIFY, basse priorité)

## Verdict coordinateur
**BUG** — l'upload d'image admin est cassé. La pièce est créée mais sans image.
