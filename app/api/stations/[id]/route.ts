import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateStationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().optional(),
})

// GET - получить станцию по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const station = await prisma.station.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: {
            _count: {
              select: { materials: true },
            },
          },
        },
      },
    })

    if (!station) {
      return NextResponse.json(
        { message: 'Станция не найдена' },
        { status: 404 }
      )
    }

    return NextResponse.json({ station })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при получении станции' },
      { status: 500 }
    )
  }
}

// PUT - обновить станцию
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = updateStationSchema.parse(body)

    const existingStation = await prisma.station.findUnique({
      where: { id: params.id },
    })

    if (!existingStation) {
      return NextResponse.json(
        { message: 'Станция не найдена' },
        { status: 404 }
      )
    }

    const station = await prisma.station.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.order !== undefined && { order: data.order }),
      },
    })

    return NextResponse.json({
      message: 'Станция успешно обновлена',
      station,
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

    console.error('Update station error:', error)
    return NextResponse.json(
      { message: 'Ошибка при обновлении станции' },
      { status: 500 }
    )
  }
}

// DELETE - удалить станцию
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const station = await prisma.station.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: {
            _count: {
              select: { materials: true },
            },
          },
        },
      },
    })

    if (!station) {
      return NextResponse.json(
        { message: 'Станция не найдена' },
        { status: 404 }
      )
    }

    // Проверяем, есть ли материалы в разделах
    const hasMaterials = station.sections.some(
      (section) => section._count.materials > 0
    )

    if (hasMaterials) {
      return NextResponse.json(
        {
          message:
            'Невозможно удалить станцию, так как в её разделах есть материалы. Сначала удалите все материалы.',
        },
        { status: 400 }
      )
    }

    // Удаляем все разделы станции
    await prisma.section.deleteMany({
      where: { stationId: params.id },
    })

    // Удаляем станцию
    await prisma.station.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Станция успешно удалена',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Delete station error:', error)
    return NextResponse.json(
      { message: 'Ошибка при удалении станции' },
      { status: 500 }
    )
  }
}

