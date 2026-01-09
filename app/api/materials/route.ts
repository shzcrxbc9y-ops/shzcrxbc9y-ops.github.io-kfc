import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const materialSchema = z.object({
  sectionId: z.string(),
  title: z.string().min(1, 'Название обязательно'),
  content: z.string().default(''),
  type: z.enum(['text', 'video', 'audio', 'image', 'pdf', 'file']).default('text'),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  order: z.number().default(0),
})

// GET - получить все материалы
export async function GET() {
  try {
    await requireAuth('ADMIN')

    const materials = await prisma.material.findMany({
      include: {
        section: {
          include: {
            station: true,
          },
        },
      },
      orderBy: [
        { sectionId: 'asc' },
        { order: 'asc' },
      ],
    })

    return NextResponse.json({ materials })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при получении материалов' },
      { status: 500 }
    )
  }
}

// POST - создать новый материал
export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = materialSchema.parse(body)

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

    const material = await prisma.material.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        content: data.content,
        type: data.type,
        videoUrl: data.videoUrl,
        imageUrl: data.imageUrl,
        audioUrl: data.audioUrl,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        order: data.order,
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
      message: 'Материал успешно создан',
      material,
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

    console.error('Create material error:', error)
    return NextResponse.json(
      { message: 'Ошибка при создании материала' },
      { status: 500 }
    )
  }
}

