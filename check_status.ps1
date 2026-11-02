#!/usr/bin/powershell
# Set the database URL for local partiva_test
$env:DATABASE_URL = "postgresql://postgres:66023@localhost:5432/partiva_test?schema=public"
$env:DATABASE_URL_UNPOOLED = "postgresql://postgres:66023@localhost:5432/partiva_test?schema=public"

# Check migration status
Write-Host "Checking migration status..."
& "F:\PartIVA\node_modules\.bin\prisma" migrate status --schema "F:\PartIVA\prisma\schema.prisma"