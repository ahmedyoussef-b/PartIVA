@echo off
rem Unset local env vars that might interfere
set DATABASE_URL=
set DATABASE_URL_UNPOOLED=
set DIRECT_URL=

rem Use the test environment
set DATABASE_URL=postgresql://postgres:66023@localhost:5432/partiva_test?schema=public
set E101_STAGING_ACK=yes

rem Check current database columns
echo.
echo Checking current Part table columns...
psql -U postgres -d partiva_test -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'Parts' ORDER BY ordinal_position;" 2>nul

rem Apply the migration
echo.
echo Applying migration...
call F:\PartIVA\node_modules\.bin\prisma migrate deploy --schema F:\PartIVA\prisma\schema.prisma