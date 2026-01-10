import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const questionUpdateSchema = z.object({
  text: z.string().min(1, 'Текст вопроса обязателен'),
  type: z.enum(['single', 'multiple']).default('single'),
  order: z.number().default(0),
})

// GET - получить вопрос
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
        test: true,
      },
    })

    if (!question) {
      return NextResponse.json(
        { message: 'Вопрос не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ question })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Get question error:', error)
    return NextResponse.json(
      { message: 'Ошибка при получении вопроса' },
      { status: 500 }
    )
  }
}

// PUT - обновить вопрос
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = questionUpdateSchema.parse(body)

    const question = await prisma.question.update({
      where: { id: params.id },
      data: {
        text: data.text,
        type: data.type,
        order: data.order,
      },
      include: {
        options: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json({
      message: 'Вопрос успешно обновлен',
      question,
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
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Update question error:', error)
    return NextResponse.json(
      { message: 'Ошибка при обновлении вопроса' },
      { status: 500 }
    )
  }
}

// DELETE - удалить вопрос
export async function DELETE(
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

    await prisma.question.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Вопрос успешно удален',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Delete question error:', error)
    return NextResponse.json(
      { message: 'Ошибка при удалении вопроса' },
      { status: 500 }
    )
  }
}
