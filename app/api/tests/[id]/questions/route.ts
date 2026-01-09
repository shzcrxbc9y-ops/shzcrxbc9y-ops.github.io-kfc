import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const questionSchema = z.object({
  text: z.string().min(1, 'Текст вопроса обязателен'),
  type: z.enum(['single', 'multiple']).default('single'),
  order: z.number().default(0),
  options: z.array(z.object({
    text: z.string().min(1, 'Текст варианта обязателен'),
    isCorrect: z.boolean().default(false),
    order: z.number().default(0),
  })).min(2, 'Должно быть минимум 2 варианта ответа'),
})

// GET - получить все вопросы теста
export async function GET(
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

    const questions = await prisma.question.findMany({
      where: { testId: params.id },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ questions })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Get questions error:', error)
    return NextResponse.json(
      { message: 'Ошибка при получении вопросов' },
      { status: 500 }
    )
  }
}

// POST - создать новый вопрос
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = questionSchema.parse(body)

    // Проверяем, существует ли тест
    const test = await prisma.test.findUnique({
      where: { id: params.id },
    })

    if (!test) {
      return NextResponse.json(
        { message: 'Тест не найден' },
        { status: 404 }
      )
    }

    // Проверяем, что есть хотя бы один правильный ответ
    const hasCorrectAnswer = data.options.some(opt => opt.isCorrect)
    if (!hasCorrectAnswer) {
      return NextResponse.json(
        { message: 'Должен быть хотя бы один правильный ответ' },
        { status: 400 }
      )
    }

    // Создаем вопрос с вариантами ответов
    const question = await prisma.question.create({
      data: {
        testId: params.id,
        text: data.text,
        type: data.type,
        order: data.order,
        options: {
          create: data.options.map((opt, index) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order !== undefined ? opt.order : index,
          })),
        },
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      message: 'Вопрос успешно создан',
      question,
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

    console.error('Create question error:', error)
    return NextResponse.json(
      { message: 'Ошибка при создании вопроса' },
      { status: 500 }
    )
  }
}
