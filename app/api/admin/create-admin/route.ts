import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Проверяем, существует ли уже админ
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    })

    if (existingAdmin) {
      return NextResponse.json(
        { 
          message: 'Администратор уже существует',
          email: existingAdmin.email,
          hint: 'Используйте существующий email для входа'
        },
        { status: 400 }
      )
    }

    // Создаем администратора
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
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

    return NextResponse.json(
      { 
        message: 'Администратор успешно создан',
        email: admin.email,
        password: 'admin123',
        hint: 'Используйте эти данные для входа'
      },
      { status: 201 }
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
