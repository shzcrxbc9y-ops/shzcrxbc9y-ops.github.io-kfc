import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const testSchema = z.object({
  sectionId: z.string().min(1, 'Раздел обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).default(70),
  timeLimit: z.number().optional(),
  isCertification: z.boolean().default(false),
})

// GET - получить все тесты
export async function GET() {
  try {
    await requireAuth('ADMIN')

    const tests = await prisma.test.findMany({
      include: {
        section: {
          include: {
            station: true,
          },
        },
        _count: {
          select: {
            questions: true,
            results: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tests })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Get tests error:', error)
    return NextResponse.json(
      { message: 'Ошибка при получении тестов' },
      { status: 500 }
    )
  }
}

// POST - создать новый тест
export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = testSchema.parse(body)

    // Проверяем, существует ли раздел
    const section = await prisma.section.findUnique({
      where: { id: data.sectionId },
    })

    if (!section) {
      return NextResponse.json(
        { message: 'Раздел не найден' },
        { status: 404 }
      )
    }

    const test = await prisma.test.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        description: data.description,
        passingScore: data.passingScore,
        timeLimit: data.timeLimit,
        isCertification: data.isCertification,
      },
      include: {
        section: {
          include: {
            station: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Тест успешно создан',
      test,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Неверные данные', errors: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Create test error:', error)
    return NextResponse.json(
      { message: 'Ошибка при создании теста' },
      { status: 500 }
    )
  }
}
