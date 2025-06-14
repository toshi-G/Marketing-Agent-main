import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set')
}

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
