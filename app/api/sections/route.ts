import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const sectionSchema = z.object({
  stationId: z.string().min(1, 'Станция обязательна'),
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  order: z.number().default(0),
})

// GET - получить все разделы
export async function GET() {
  try {
    await requireAuth('ADMIN')

    const sections = await prisma.section.findMany({
      include: {
        station: true,
        _count: {
          select: { materials: true },
        },
      },
      orderBy: [
        { stationId: 'asc' },
        { order: 'asc' },
      ],
    })

    return NextResponse.json({ sections })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при получении разделов' },
      { status: 500 }
    )
  }
}

// POST - создать новый раздел
export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = sectionSchema.parse(body)

    // Проверяем, существует ли станция
    const station = await prisma.station.findUnique({
      where: { id: data.stationId },
    })

    if (!station) {
      return NextResponse.json(
        { message: 'Станция не найдена' },
        { status: 404 }
      )
    }

    const section = await prisma.section.create({
      data: {
        stationId: data.stationId,
        title: data.title,
        description: data.description,
        order: data.order,
      },
      include: {
        station: true,
      },
    })

    return NextResponse.json({
      message: 'Раздел успешно создан',
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

    console.error('Create section error:', error)
    return NextResponse.json(
      { message: 'Ошибка при создании раздела' },
      { status: 500 }
    )
  }
}

