import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSectionSchema = z.object({
  stationId: z.string().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

// GET - получить раздел по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        station: true,
        _count: {
          select: { materials: true },
        },
      },
    })

    if (!section) {
      return NextResponse.json(
        { message: 'Раздел не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ section })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при получении раздела' },
      { status: 500 }
    )
  }
}

// PUT - обновить раздел
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = updateSectionSchema.parse(body)

    const existingSection = await prisma.section.findUnique({
      where: { id: params.id },
    })

    if (!existingSection) {
      return NextResponse.json(
        { message: 'Раздел не найден' },
        { status: 404 }
      )
    }

    // Если меняется станция, проверяем её существование
    if (data.stationId && data.stationId !== existingSection.stationId) {
      const station = await prisma.station.findUnique({
        where: { id: data.stationId },
      })

      if (!station) {
        return NextResponse.json(
          { message: 'Станция не найдена' },
          { status: 404 }
        )
      }
    }

    const section = await prisma.section.update({
      where: { id: params.id },
      data: {
        ...(data.stationId && { stationId: data.stationId }),
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.order !== undefined && { order: data.order }),
      },
      include: {
        station: true,
      },
    })

    return NextResponse.json({
      message: 'Раздел успешно обновлен',
      section,
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

    console.error('Update section error:', error)
    return NextResponse.json(
      { message: 'Ошибка при обновлении раздела' },
      { status: 500 }
    )
  }
}

// DELETE - удалить раздел
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { materials: true },
        },
      },
    })

    if (!section) {
      return NextResponse.json(
        { message: 'Раздел не найден' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли материалы в разделе
    if (section._count.materials > 0) {
      return NextResponse.json(
        {
          message:
            'Невозможно удалить раздел, так как в нём есть материалы. Сначала удалите все материалы.',
        },
        { status: 400 }
      )
    }

    await prisma.section.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Раздел успешно удален',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Delete section error:', error)
    return NextResponse.json(
      { message: 'Ошибка при удалении раздела' },
      { status: 500 }
    )
  }
}

