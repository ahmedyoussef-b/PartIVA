# Audit Freerouting — Étape 1.1 (2026-11-26)

## 1. Version actuelle

- **Fichier** : `tools/freerouting.jar` (66 402 315 octets, dernière écriture 2025-11-25).
- **Version** : `Freerouting v2.0.1` (build-date 2024-11-14).
- **Java** : Temurin 21.0.13.1 (la v2.6.0 nécessite Java 21+ — compatible).
- **Détecté au lancement** : "New version available: v2.6.0" (le jar 2.0.1 le signale lui-même).
- **Version cible** : **v2.6.0** (jar 63.2 Mo, release du 25 nov. 2026, `freerouting-2.6.0.jar`).
- **Checksum SHA-256 (v2.6.0)** : `a2929fe37767a71d119f52ac99a1615a9aa2b0538742fa514ddafd72a7785729`.

## 2. Appel Freerouting dans le code

**Fichier** : `src/app/api/pcb/autoroute/freerouting/route.ts`

### Options CLI actuellement passées
```
java -jar <jar> -de <dsnPath> -do <sesPath> -mp <passes> --gui.enabled=false
```
- `-de` : DSN d'entrée (exporté par KiCad).
- `-do` : SES de sortie.
- `-mp <passes>` : passes d'optimisation (défaut 10, env `FREEROUTING_PASSES`, clampé 1-50).
- `--gui.enabled=false` : mode headless.

### Pré-traitement avant Freerouting (déjà fait)
1. Assignation des nets aux pads (`assignBoardNets`) — refus si 0 pad assigné.
2. Export DSN (`exportDsn`).
3. Assainissement ANSI (`sanitizeDsn`) : Ω→Ohm, µ→u, espaces fins→space, etc.
4. Vérification `countSesWires` > 0 après exécution.

### Parser de sortie
- `countSesWires(sesPath)` : compte les `(wire` dans le SES.
- `runDrc(boardPath)` : `kicad-cli pcb drc --format json` → `{ violations, unconnected }`.
- Pas d'extraction de score (v2.0.1 ne l'expose pas dans le stdout parsable).
- Pas de distinction violations pré-existantes vs introduites.

### Variables d'environnement
- `FREEROUTING_JAR` : chemin du jar (défaut `tools/freerouting.jar` ou `desktop/tools/freerouting.jar`).
- `FREEROUTING_JAVA` : binaire java (défaut `java`).
- `FREEROUTING_PASSES` : passes (défaut 10).

## 3. Disponibilité v2.6.0 et nouvelles fonctionnalités

**Disponible** : oui, release du 25 nov. 2026, jar 63.2 Mo, Java 21+ requis (compatible).

### Fonctionnalités v2.6.0 pertinentes pour nos 10 points

| Fonctionnalité | Point externe | Option CLI / comportement |
|---|---|---|
| Copper pour & power plane awareness | #6 | Automatique (lecture des zones du DSN). Notre DSN exporte déjà les zones (KiCad les inclut). |
| Pre-existing DRC violation categorization | #9 | Automatique : le routeur distingue violations pré-existantes vs introduites. |
| Rip-up memory | #8 | Automatique : un net se souvient de celui qui l'a ripé. |
| Optimizer controls & passes | #8 | `-mp <n>` (déjà utilisé) + presets de patience. |
| Fanout pre-pass pour SMD denses | #8 | Nouveau : activé par défaut ou via option. |
| Micro-neckdown fallback | #8 | Nouveau : retry à largeur réduite. |
| Score V2 (0-1000) | #7 | Exposé dans le stdout / rapport. |
| KiCad rules & DRC parity | #1/#9 | Clearance/creepage depuis `.kicad_dru`, copper-to-edge, etc. |
| Net-ties | — | Reconnaissance des pads superposés multi-net. |
| Priority net classes | — | Routage des classes prioritaires en premier. |

### Options CLI à ajouter en v2.6.0
- `-mp 20` (déjà supporté, augmenter le défaut).
- `-inc GND,VCC` (ignorer les nets gérés par les zones de cuivre) — **nouveau**.
- `-dr` (rip-up and reroute) — **nouveau** (ou équivalent `--router.ripup`).
- `--router.copperToEdgeClearanceUm=500` — option pour le DSN (mitigation KiCad #558).
- `--gui.enabled=false` (déjà utilisé).

### Compatibilité
- Le format DSN/SES est inchangé (Specctra). Notre export/import KiCad reste valide.
- Le jar est plus léger (63.2 vs 66.4 Mo).
- Java 21 toujours requis (on a 21.0.13.1).

## 4. Risques identifiés

1. **Changement de format de sortie** : le stdout peut avoir changé. Le parser actuel lit le SES (fichier), pas le stdout, donc risque faible. Mais le score (point 7) nécessite de parser le stdout ou le rapport.
2. **Options CLI renommées** : `-mp`, `-de`, `-do` sont stables depuis v2.0. Le nouveau `-inc` et `-dr` doivent être vérifiés sur le jar téléchargé.
3. **Incompatibilité du jar** : faible, le format DSN/SES est standard Specctra. Mais tester sur la carte de référence.
4. **Performance** : v2.6.0 prend plus de temps (13 463 s vs 6 457 s sur le corpus). Notre timeout est 5 min (`ROUTING_TIMEOUT_MS`). À surveiller.
5. **Java** : v2.6.0 nécessite Java 21+ (on a 21.0.13.1 — OK). Vérifier que `java -version` pointe bien sur Temurin 21.

## 5. Plan d'action pour l'Étape 1.2

1. Télécharger `freerouting-2.6.0.jar` → `tools/freerouting.jar` (backup de l'ancien en `tools/freerouting-2.0.1.jar.bak`).
2. Vérifier `java -jar tools/freerouting.jar --version` → doit afficher 2.6.0.
3. Lancer un routage test sur la carte de référence, comparer les violations (cible -30%).
4. Ajouter les options `-inc GND,VCC` et `-dr` (ou équivalent) dans `freerouting/route.ts`.
5. Parser le score depuis le stdout ou le rapport, l'exposer dans la réponse API.
6. Mettre à jour les tests (`freerouting/route.test.ts`) si le format de sortie change.

## 6. Ce que je ne recommande pas de changer

- Ne pas réécrire le pipeline DSN/SES : le format Specctra est standard et stable.
- Ne pas supprimer l'assainissement ANSI (`sanitizeDsn`) : KiCad exporte encore des caractères non-ASCII.
- Garder la vérification 0-pad (`assignedPads === 0` → erreur) : elle évite les court-circuits.

---

*Rapport généré le 2026-11-26. Basé sur l'audit du code (`freerouting/route.ts`, `kicad-bridge.ts`, `drc.ts`) et des release notes v2.5.0/v2.6.0 sur GitHub.*
