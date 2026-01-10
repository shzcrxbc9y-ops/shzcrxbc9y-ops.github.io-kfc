import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const testUpdateSchema = z.object({
  sectionId: z.string().min(1, 'Раздел обязателен'),
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  passingScore: z.number().min(0).max(100).default(70),
  timeLimit: z.number().optional(),
  isCertification: z.boolean().default(false),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        section: {
          include: {
            station: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ message: 'Тест не найден' }, { status: 404 })
    }

    // Убираем правильные ответы из опций
    const testWithoutAnswers = {
      ...test,
      questions: test.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
        })),
      })),
    }

    return NextResponse.json({ test: testWithoutAnswers })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { message: 'Ошибка загрузки теста' },
      { status: 500 }
    )
  }
}

// PUT - обновить тест
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = testUpdateSchema.parse(body)

    // Проверяем, существует ли тест
    const existingTest = await prisma.test.findUnique({
      where: { id: params.id },
    })

    if (!existingTest) {
      return NextResponse.json(
        { message: 'Тест не найден' },
        { status: 404 }
      )
    }

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

    const test = await prisma.test.update({
      where: { id: params.id },
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
      message: 'Тест успешно обновлен',
      test,
    })
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

    console.error('Update test error:', error)
    return NextResponse.json(
      { message: 'Ошибка при обновлении теста' },
      { status: 500 }
    )
  }
}

// DELETE - удалить тест
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const test = await prisma.test.findUnique({
      where: { id: params.id },
    })

    if (!test) {
      return NextResponse.json(
        { message: 'Тест не найден' },
        { status: 404 }
      )
    }

    await prisma.test.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Тест успешно удален',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Delete test error:', error)
    return NextResponse.json(
      { message: 'Ошибка при удалении теста' },
      { status: 500 }
    )
  }
}
