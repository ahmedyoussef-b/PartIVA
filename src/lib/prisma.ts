import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

const adapter = new PrismaPg(
  {
    connectionString,
    connectionTimeoutMillis: 30000,
  },
  {
    schema: 'public',
  }
)

export const prisma = new PrismaClient({ adapter })
