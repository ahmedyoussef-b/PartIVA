# Encodage - Convention Projet

## Règle
Tous les fichiers texte du repo doivent être **UTF-8 sans BOM**, fins de ligne **LF**.

## Config VSCode recommandée (settings utilisateur, pas projet)
Ctrl+Shift+P puis Preferences: Open User Settings (JSON) :

{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}

## Config locale (optionnelle)
Ce fichier est ignoré par .gitignore. Chaque dev peut créer son propre .vscode/settings.json local.

## Raison
Trois incidents de BOM réintroduit en V3/V4-A (check-env.ts, workspace.spec.ts, .gitignore). Voir dette D-CAMPAGNE-ENCODING.
