import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'
import { Pool } from 'pg'

const connectionString = `${process.env.DATABASE_URL}`

// Use a global pool to manage connections better in dev
declare global {
    var prisma: PrismaClient | undefined
    var pgPool: Pool | undefined
}

const pool = global.pgPool || new Pool({
    connectionString,
    max: 50, // Increased to 50 to handle more concurrent SSE/Admin users
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Keep 10s timeout
})

if (process.env.NODE_ENV !== 'production') global.pgPool = pool

const adapter = new PrismaPg(pool)
const prisma = global.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma