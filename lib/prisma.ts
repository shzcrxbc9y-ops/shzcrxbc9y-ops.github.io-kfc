import { PrismaClient } from '@prisma/client'
import { join } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Исправляем DATABASE_URL для SQLite, если используется относительный путь
let databaseUrl = process.env.DATABASE_URL
if (databaseUrl && typeof window === 'undefined') {
  // Если путь относительный, преобразуем в абсолютный
  if (databaseUrl.startsWith('file:./')) {
    const dbPath = databaseUrl.replace('file:', '').replace(/^\.\//, '')
    const absolutePath = join(process.cwd(), dbPath).replace(/\\/g, '/')
    databaseUrl = `file:${absolutePath}`
    process.env.DATABASE_URL = databaseUrl
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Проверка подключения к базе данных при старте
if (typeof window === 'undefined') {
  prisma.$connect().catch((error) => {
    console.error('Failed to connect to database:', error)
    console.error('DATABASE_URL:', process.env.DATABASE_URL)
    if (error.message?.includes('Can\'t reach database') || error.code === 'P1001') {
      console.error('DATABASE_URL might be incorrect or database is not accessible')
      console.error('Current working directory:', process.cwd())
    }
  })
}
