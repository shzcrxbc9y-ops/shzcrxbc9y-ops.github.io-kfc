import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const optionSchema = z.object({
  text: z.string().min(1, 'Текст варианта обязателен'),
  isCorrect: z.boolean().default(false),
  order: z.number().default(0),
})

// GET - получить все варианты ответа вопроса
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const question = await prisma.question.findUnique({
      where: { id: params.id },
    })

    if (!question) {
      return NextResponse.json(
        { message: 'Вопрос не найден' },
        { status: 404 }
      )
    }

    const options = await prisma.option.findMany({
      where: { questionId: params.id },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ options })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Get options error:', error)
    return NextResponse.json(
      { message: 'Ошибка при получении вариантов ответа' },
      { status: 500 }
    )
  }
}

// POST - создать новый вариант ответа
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = optionSchema.parse(body)

    const question = await prisma.question.findUnique({
      where: { id: params.id },
    })

    if (!question) {
      return NextResponse.json(
        { message: 'Вопрос не найден' },
        { status: 404 }
      )
    }

    // Если это вопрос с одним правильным ответом и добавляется новый правильный ответ,
    // нужно проверить, что не будет несколько правильных ответов
    if (question.type === 'single' && data.isCorrect) {
      const existingCorrect = await prisma.option.findFirst({
        where: {
          questionId: params.id,
          isCorrect: true,
        },
      })

      if (existingCorrect) {
        return NextResponse.json(
          { message: 'Для вопроса с одним правильным ответом может быть только один правильный вариант' },
          { status: 400 }
        )
      }
    }

    const option = await prisma.option.create({
      data: {
        questionId: params.id,
        text: data.text,
        isCorrect: data.isCorrect,
        order: data.order,
      },
    })

    return NextResponse.json({
      message: 'Вариант ответа успешно создан',
      option,
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
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Create option error:', error)
    return NextResponse.json(
      { message: 'Ошибка при создании варианта ответа' },
      { status: 500 }
    )
  }
}
