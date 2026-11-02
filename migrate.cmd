set DATABASE_URL=postgresql://postgres:66023@localhost:5432/partiva_test?schema=public
set E101_STAGING_ACK=yes
F:\PartIVA\node_modules\.bin\prisma migrate deploy --schema F:\PartIVA\prisma\schema.prisma