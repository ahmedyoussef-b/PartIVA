# Set the database URL for local partiva_test
$env:DATABASE_URL = "postgresql://postgres:66023@localhost:5432/partiva_test?schema=public"

# Check migration status
Write-Host "Checking migration status with DATABASE_URL=$env:DATABASE_URL"
& "F:\PartIVA\node_modules\.bin\prisma" migrate status --schema "F:\PartIVA\prisma\schema.prisma"