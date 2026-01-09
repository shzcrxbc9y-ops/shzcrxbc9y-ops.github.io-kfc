import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - получить всех пользователей
export async function GET(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const users = await prisma.user.findMany({
      include: {
        progress: true,
        _count: {
          select: {
            testResults: true,
            certifications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Get users error:', error)
    return NextResponse.json(
      { message: 'Ошибка при получении пользователей' },
      { status: 500 }
    )
  }
}
