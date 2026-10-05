import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

const adapter = new PrismaPg({
  connectionString,
  // Neon serverless: increase connect timeout to handle scale-to-zero
  options: {
    connect_timeout: 30,
  },
})

export const prisma = new PrismaClient({ adapter })
