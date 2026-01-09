import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const stationSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  order: z.number().default(0),
})

// GET - получить все станции
export async function GET() {
  try {
    await requireAuth('ADMIN')

    const stations = await prisma.station.findMany({
      include: {
        sections: {
          include: {
            _count: {
              select: { materials: true },
            },
          },
        },
        _count: {
          select: { sections: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ stations })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при получении станций' },
      { status: 500 }
    )
  }
}

// POST - создать новую станцию
export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = stationSchema.parse(body)

    const station = await prisma.station.create({
      data: {
        name: data.name,
        description: data.description,
        order: data.order,
      },
    })

    return NextResponse.json({
      message: 'Станция успешно создана',
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

    console.error('Create station error:', error)
    return NextResponse.json(
      { message: 'Ошибка при создании станции' },
      { status: 500 }
    )
  }
}

