# PartIVA PCB Studio — Installation Windows
# Vérifie les prérequis, installe Freerouting 2.6.0 et les dépendances.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
Set-Location $root

function Check-Command($name, $minVersion, $hint) {
  $cmd = Get-Command $name -ErrorAction SilentlyContinue
  if (-not $cmd) { throw "$name introuvable. $hint" }
  Write-Host "✓ $name trouvé : $($cmd.Source)"
}

Write-Host "=== Vérification des prérequis ==="
Check-Command 'node' '20' 'Installez Node.js 20+ (https://nodejs.org).'
$nodeVersion = [int]((node --version).TrimStart('v').Split('.')[0])
if ($nodeVersion -lt 20) { throw "Node.js $nodeVersion < 20." }

$java = (Get-Command java -ErrorAction SilentlyContinue)
if (-not $java) { throw 'Java introuvable. Installez Temurin 25 : winget install EclipseAdoptium.Temurin.25.JDK' }
$javaVersion = & java -version 2>&1 | Select-Object -First 1
Write-Host "✓ Java : $javaVersion"
if ("$javaVersion" -notmatch '"25') {
  Write-Warning 'Java 25 requis pour Freerouting 2.6.0. Installez-le : winget install EclipseAdoptium.Temurin.25.JDK'
}

$kicadCli = 'C:\Program Files\KiCad\10.0\bin\kicad-cli.exe'
if (-not (Test-Path $kicadCli)) {
  Write-Warning "kicad-cli introuvable à $kicadCli. Installez KiCad 10 (https://kicad.org)."
} else { Write-Host "✓ KiCad 10 : $kicadCli" }

Write-Host "=== Freerouting 2.6.0 ==="
$jar = Join-Path $root 'tools\freerouting.jar'
$expected = 'a2929fe37767a71d119f52ac99a1615a9aa2b0538742fa514ddafd72a7785729'
if (-not (Test-Path $jar)) {
  New-Item -ItemType Directory -Force -Path (Join-Path $root 'tools') | Out-Null
  Invoke-WebRequest -Uri 'https://github.com/freerouting/freerouting/releases/download/v2.6.0/freerouting-2.6.0.jar' -OutFile $jar
}
$actual = (Get-FileHash -Algorithm SHA256 $jar).Hash
if ($actual -ne $expected) { throw "Checksum Freerouting invalide : $actual" }
Write-Host "✓ Freerouting 2.6.0 (SHA-256 OK)"

Write-Host "=== Dépendances npm ==="
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install a échoué.' }

Write-Host "=== Migrations Prisma ==="
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw 'Migration Prisma impossible (vérifiez DATABASE_URL).' }

Write-Host "`n✓ Installation terminée."
Write-Host "Prochaines étapes :"
Write-Host "  1. Copier .env.example vers .env.local et renseigner DATABASE_URL / BETTER_AUTH_SECRET"
Write-Host "  2. npm run dev"
Write-Host "  3. Consulter docs/QUICKSTART.md"
