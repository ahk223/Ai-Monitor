import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  // Create a pg Pool
  const pool = new Pool({ connectionString })

  // Create the Prisma adapter
  const adapter = new PrismaPg(pool)

  // Create PrismaClient with the adapter
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
