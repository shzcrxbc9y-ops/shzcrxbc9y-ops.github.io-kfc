import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken, UserRole } from '@/lib/auth'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = loginSchema.parse(body)

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

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    const isValid = await verifyPassword(data.password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { message: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Генерируем токен
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    })

    // Устанавливаем cookie
    const cookieStore = await cookies()
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })

    return NextResponse.json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        position: user.position,
      },
    })
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

    console.error('Login error:', error)
    return NextResponse.json(
      { 
        message: 'Ошибка входа',
        error: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

