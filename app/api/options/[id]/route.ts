import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const optionUpdateSchema = z.object({
  text: z.string().min(1, 'Текст варианта обязателен'),
  isCorrect: z.boolean().default(false),
  order: z.number().default(0),
})

// PUT - обновить вариант ответа
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = optionUpdateSchema.parse(body)

    const option = await prisma.option.findUnique({
      where: { id: params.id },
      include: {
        question: true,
      },
    })

    if (!option) {
      return NextResponse.json(
        { message: 'Вариант ответа не найден' },
        { status: 404 }
      )
    }

    // Если это вопрос с одним правильным ответом и устанавливается новый правильный ответ,
    // нужно сбросить другие правильные ответы
    if (option.question.type === 'single' && data.isCorrect && !option.isCorrect) {
      await prisma.option.updateMany({
        where: {
          questionId: option.questionId,
          id: { not: params.id },
        },
        data: {
          isCorrect: false,
        },
      })
    }

    const updatedOption = await prisma.option.update({
      where: { id: params.id },
      data: {
        text: data.text,
        isCorrect: data.isCorrect,
        order: data.order,
      },
    })

    return NextResponse.json({
      message: 'Вариант ответа успешно обновлен',
      option: updatedOption,
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

    console.error('Update option error:', error)
    return NextResponse.json(
      { message: 'Ошибка при обновлении варианта ответа' },
      { status: 500 }
    )
  }
}

// DELETE - удалить вариант ответа
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const option = await prisma.option.findUnique({
      where: { id: params.id },
    })

    if (!option) {
      return NextResponse.json(
        { message: 'Вариант ответа не найден' },
        { status: 404 }
      )
    }

    await prisma.option.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Вариант ответа успешно удален',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Delete option error:', error)
    return NextResponse.json(
      { message: 'Ошибка при удалении варианта ответа' },
      { status: 500 }
    )
  }
}
