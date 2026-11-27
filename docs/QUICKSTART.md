# Démarrage rapide — Clignotant LED

Exemple complet, du CDC à l'export fabrication.

## 1. Créer le projet

1. Connectez-vous comme admin.
2. `Espace admin → PCB → Nouveau projet`, nommez-le **Clignotant LED**.
3. Dans la carte **Cahier des charges**, cliquez sur **Ouvrir un nouveau fichier** (crée le plateau KiCad), puis saisissez le CDC :

```
Carte de clignotant LED 5 V.
Alimentée en 5 V DC via un connecteur 2 broches.
Utilise un NE555 en astable, une LED rouge et une résistance de limitation.
Fréquence ≈ 1 Hz.
```

4. Cliquez sur **Analyser / Valider le cahier des charges**.

## 2. Générer le circuit

1. Dans la carte **Sourcing**, cliquez sur **Lancer**.
2. Le processus enchaîne : composants (LLM) → validation de la netlist → placement → connexions GND/VCC → routage assisté → Freerouting.
3. Le bouton **Afficher les résultats** apparaît dans l'en-tête. Cliquez dessus : le layout PCB se remplit et KiCad s'ouvre sous le nom du projet.

## 3. Vérifier

- **Assistant PCB** (bas du canvas) : étapes validées, prochain bouton surligné.
- **Récapitulatif routage** : score /1000, pistes, violations DRC catégorisées, historique des routages.
- **Voir les détails DRC** : liste des violations avec position et suggestion.
- Si la netlist est bloquée : **Éditer la Netlist**, corriger, puis **Relancer**.

## 4. Option manuelle

Au lieu du flux complet, cliquez sur **Valider et placer dans KiCad** pour chaque composant de la liste, puis sur **Placer routage et connexion**. Le résultat reste masqué jusqu'à **Afficher les résultats**.

## 5. Exporter

1. Vérifiez le badge **Conformité JLCPCB**.
2. Cliquez sur **Exporter pour JLCPCB**.
3. Le téléchargement contient : Gerbers (`.gtl`, `.gbl`, …), fichier de perçage `.drl`, `bom.csv`, `pos.csv`.

## 6. Vue 3D

Dans le canvas, cliquez sur **Vue 3D**. Rotation au clic gauche, zoom à la molette, panoramique au clic droit. Si le modèle GLB est indisponible, un rendu paramétrique prend le relais.
