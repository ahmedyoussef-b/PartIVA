#!/usr/bin/env bash
# PartIVA PCB Studio — Installation Linux/macOS
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "=== Vérification des prérequis ==="
command -v node >/dev/null || { echo "Node.js introuvable (20+)."; exit 1; }
NODE_MAJOR="$(node --version | sed 's/^v//' | cut -d. -f1)"
[ "$NODE_MAJOR" -ge 20 ] || { echo "Node.js $NODE_MAJOR < 20."; exit 1; }
echo "✓ Node.js $(node --version)"

command -v java >/dev/null || { echo "Java 25 requis : sdk install java 25-tem ou équivalent."; exit 1; }
JAVA_VERSION="$(java -version 2>&1 | head -n1)"
echo "✓ $JAVA_VERSION"
if [[ "$JAVA_VERSION" != *'"25'* ]]; then
  echo "⚠ Java 25 requis pour Freerouting 2.6.0."
fi

if command -v kicad-cli >/dev/null; then
  echo "✓ kicad-cli : $(command -v kicad-cli)"
else
  echo "⚠ kicad-cli introuvable — installez KiCad 10 (https://kicad.org)."
fi

echo "=== Freerouting 2.6.0 ==="
mkdir -p tools
JAR="$ROOT/tools/freerouting.jar"
EXPECTED="a2929fe37767a71d119f52ac99a1615a9aa2b0538742fa514ddafd72a7785729"
if [ ! -f "$JAR" ]; then
  curl -L -o "$JAR" https://github.com/freerouting/freerouting/releases/download/v2.6.0/freerouting-2.6.0.jar
fi
if command -v sha256sum >/dev/null; then
  ACTUAL="$(sha256sum "$JAR" | cut -d' ' -f1)"
  [ "$ACTUAL" = "$EXPECTED" ] || { echo "Checksum Freerouting invalide : $ACTUAL"; exit 1; }
fi
echo "✓ Freerouting 2.6.0 (SHA-256 OK)"

echo "=== Dépendances npm ==="
npm install

echo "=== Migrations Prisma ==="
npx prisma migrate deploy

echo ""
echo "✓ Installation terminée."
echo "Prochaines étapes :"
echo "  1. cp .env.example .env.local et renseigner DATABASE_URL / BETTER_AUTH_SECRET"
echo "  2. npm run dev"
echo "  3. Consulter docs/QUICKSTART.md"
