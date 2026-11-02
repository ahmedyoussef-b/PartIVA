@echo off
set DATABASE_URL=postgresql://postgres:66023@localhost:5432/partiva_test?schema=public
set E101_STAGING_ACK=yes
call F:\PartIVA\node_modules\.bin\prisma migrate status --schema F:\PartIVA\prisma\schema.prisma