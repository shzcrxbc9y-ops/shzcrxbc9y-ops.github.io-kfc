import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  position: z.string().optional(),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Проверяем подключение к базе данных
    try {
      await prisma.$connect()
    } catch (dbError: any) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { message: 'Ошибка подключения к базе данных. Проверьте настройки DATABASE_URL.' },
        { status: 500 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Создаем пользователя
    const hashedPassword = await hashPassword(data.password)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position,
        role: 'EMPLOYEE',
      },
    })

    // Создаем прогресс для пользователя
    await prisma.progress.create({
      data: {
        userId: user.id,
      },
    })

    return NextResponse.json(
      { message: 'Регистрация успешна', userId: user.id },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Неверные данные', errors: error.errors },
        { status: 400 }
      )
    }

    // Проверка ошибок подключения к базе данных
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database')) {
      console.error('Database connection error:', error)
      return NextResponse.json(
        { message: 'Ошибка подключения к базе данных. Проверьте настройки DATABASE_URL.' },
        { status: 500 }
      )
    }

    // Проверка ошибок Prisma
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { message: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { 
        message: 'Ошибка регистрации',
        error: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

