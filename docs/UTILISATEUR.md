# Guide utilisateur — PartIVA PCB Studio

PartIVA transforme un cahier des charges en carte PCB prête à fabriquer : le LLM fournit la **topologie** (composants + nets), l'application calcule le **placement** et le **routage** de façon déterministe, puis produit les fichiers de fabrication.

## Prérequis

| Outil | Version | Rôle |
|---|---|---|
| Node.js | 20+ (22 recommandé) | Serveur Next.js |
| KiCad | 10.x | `kicad-cli` : export DSN/GLB/Gerber/Drill, DRC |
| Java (Temurin) | **25** | Freerouting 2.6.0 (compilé en Java 25) |
| Freerouting | **2.6.0** | Routage automatique (`tools/freerouting.jar`) |
| PostgreSQL/Neon | — | Base de données (`DATABASE_URL`) |

Le script `scripts/install.ps1` (Windows) ou `scripts/install.sh` (Linux/Mac) installe les dépendances et vérifie les versions.

## Flux complet

1. **Cahier des charges** — Créer un projet, rédiger le CDC puis valider. Le bouton « Ouvrir un nouveau fichier » crée le plateau KiCad. « Reset » revient juste après la validation CDC.
2. **Sourcing** — Cliquer **Lancer** : la netlist est générée et validée, les composants sont posés (connecteurs sur les bords, ICs au centre, passifs autour), les connexions GND/VCC sont créées, puis le routage s'exécute en arrière-plan (assisté + Freerouting).
   - Boutons disponibles : **Éditer la Netlist**, **Relancer**, **Afficher les résultats**, **Re-router avec score minimum**, **Exporter pour JLCPCB**.
   - Si la netlist est incohérente (pin inexistant, IC sans GND), le placement est **bloqué** et un bandeau rouge renvoie vers l'éditeur de netlist.
3. **Affichage** — « Afficher les résultats » met à jour le layout PCB (pistes/vias/zones, toggle « Cuivre ») et ouvre le fichier KiCad nommé d'après le projet. La fenêtre déjà ouverte est **rafraîchie**, jamais dupliquée.
4. **Mode manuel (optionnel)** — « Valider et placer dans KiCad » composant par composant, puis « Placer routage et connexion » complète le schéma. Le résultat reste masqué jusqu'à « Afficher les résultats ».
5. **Routage itératif** — Le score 0-1000 et les violations DRC catégorisées (placement / routage / fabrication / pré-existantes) s'affichent. « Re-router avec score minimum » conserve le meilleur routage.
6. **Fabrication** — Badge de conformité JLCPCB, puis « Exporter pour JLCPCB » télécharge une archive ZIP (Gerbers, Drill, BOM CSV, Pos CSV).
7. **Vue 3D** — Le bouton « Vue 3D » du canvas affiche le PCB en 3D (rotation, zoom, panoramique).

## Dépannage

| Symptôme | Solution |
|---|---|
| `Unexpected token '<'` au placement | Route Next en recompilation : rechargez la page. |
| « Freerouting non installé » | Java 25 + `tools/freerouting.jar` (voir `scripts/install.ps1`). |
| `UnsupportedClassVersionError` (class 69) | Le jar 2.6.0 exige Java 25 ; mettez à jour le JDK. |
| « Projet sans fichier KiCad » | Cliquez sur « Ouvrir un nouveau fichier » dans la carte Cahier des charges. |
| Netlist bloquée | Corrigez via « Éditer la Netlist » (GND/VCC manquants, pins inexistants). |
| DRC non vert | Consultez « Voir les détails DRC » : les violations sont catégorisées avec suggestions. |
| Historique vide après mise à jour du schéma Prisma | Redémarrez le serveur après `prisma generate`, puis `npx prisma migrate deploy`. |
| Boucle de chargement dans le navigateur de test | Redémarrez le serveur de développement (client HMR Turbopack). |

## Limites connues

- La netlist LLM est **minimale** (alimentation + GND + signal principal) : tous les pads d'un IC ne sont pas necessarily câblés. Utilisez l'éditeur de netlist pour les cas complexes.
- Le DRC peut rester non vert : la qualité dépend de la netlist et des empreintes.
- Freerouting et KiCad sont des binaires locaux : installer sur chaque environnement.
