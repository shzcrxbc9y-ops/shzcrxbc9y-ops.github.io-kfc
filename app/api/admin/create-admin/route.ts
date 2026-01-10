import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Создаем или обновляем администратора (используем upsert для избежания ошибок)
    const adminPassword = await bcrypt.hash('admin123', 10)
    
    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@kfc.com' },
    })
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@kfc.com' },
      update: {
        // Всегда обновляем пароль и роль
        password: adminPassword,
        role: 'ADMIN',
        firstName: 'Администратор',
        lastName: 'Системы',
        position: 'Администратор',
      },
      create: {
        email: 'admin@kfc.com',
        password: adminPassword,
        firstName: 'Администратор',
        lastName: 'Системы',
        role: 'ADMIN',
        position: 'Администратор',
        progress: {
          create: {},
        },
      },
    })

    // Создаем прогресс, если его нет
    if (!existingAdmin || !existingAdmin.id) {
      await prisma.progress.upsert({
        where: { userId: admin.id },
        update: {},
        create: {
          userId: admin.id,
        },
      })
    }

    return NextResponse.json(
      { 
        message: existingAdmin ? 'Пароль администратора успешно обновлен' : 'Администратор успешно создан',
        email: admin.email,
        password: 'admin123',
        hint: 'Используйте эти данные для входа'
      },
      { status: existingAdmin ? 200 : 201 }
    )
  } catch (error: any) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { 
        message: 'Ошибка создания администратора',
        error: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1' ? error.message : undefined
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
