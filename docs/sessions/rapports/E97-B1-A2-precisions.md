# E97-B1-A2 — Précisions sur les 3 sélecteurs inconnus

## Section 1 — Heading zone "Collecte"

Extrait (IngestZone.tsx:124-125) :
```tsx
<h2 className="text-lg font-semibold">Collecte</h2>
```
AssistantZone.tsx:163 : `<h2 className="mb-2 text-lg font-semibold">Assistant IA</h2>`

Libellé actuel exact : **"Collecte"** et **"Assistant IA"** (h2, pas h1/h3). Le test `getByRole('heading', { name: /Collecte/i })` devrait toujours matcher. Le 3e zone (ViewerZone) n'a pas de heading → "three zones" repose probablement sur les 2 headings + placeholder. Le test échoue probablement car le placeholder texte a changé (zone Viewer non détectée).

## Section 2 — Format résultats recherche

AssistantZone.tsx:96 : `content: \`Résultats recherche (${result.search.candidates.length})\``

Texte exact actuel : **"Résultats recherche (2)"** pour 2 candidats. Le format n'a pas changé. Le test `getByText(/R.sultats recherche \(2\)/i)` devrait matcher. Échec probable car le texte est rendu dans `messages` array → affiché dans un `<div>` avec `whitespace-pre-wrap`. Possible mismatch d'encodage ou timing (result pas encore rendu). À re-vérifier à l'exécution.

## Section 3 — Contrôle mode deep

IngestZone.tsx:266-273 :
```tsx
<select value={mode} onChange={(e) => onModeChange(e.target.value as 'quick' | 'deep')} ...>
  <option value="quick">Rapide (quick)</option>
  <option value="deep">Reconstruction (deep)</option>
</select>
```
C'est un `<select>` standard (pas de combobox role explicite, mais Playwright le mappe en `combobox`). Il y a **deux** `<select>` dans IngestZone : unité (mm/cm) et mode. Le test utilise `page.getByRole('combobox').nth(1)` → pointe sur le 2e combobox = mode. Le sélecteur est fragile mais devrait fonctionner. Pas de `data-testid` → à ajouter pour stabiliser.

## Section 4 — Sortie brute Playwright

Exécution de référence : 11 passed / 6 failed (~1.9m). Les 6 échecs confirmés :
1. `loads with three zones` — heading/zone non trouvé
2. `placeholder visible initially` — texte obsolète
3. `deep mode sends mode deep` — mode !== deep (timing/sélecteur)
4. `search results display two candidates` — texte non trouvé (timing)
5. `deep mode triggers engine with deep` — mode !== deep
6. `placeholder when no fileurl` — texte obsolète

Cause racine dominante : texte placeholder "Aucun modèle 3D disponible" → actuel "Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer." (ViewerZone.tsx:82). Les tests deep/search sont des problèmes de timing/sélecteur à confirmer lors de la correction.