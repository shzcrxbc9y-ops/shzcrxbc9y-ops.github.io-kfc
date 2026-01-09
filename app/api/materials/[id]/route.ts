import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateMaterialSchema = z.object({
  sectionId: z.string().optional(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  type: z.enum(['text', 'video', 'audio', 'image', 'pdf', 'file']).optional(),
  videoUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  order: z.number().optional(),
})

// GET - получить материал по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        section: {
          include: {
            station: true,
          },
        },
      },
    })

    if (!material) {
      return NextResponse.json(
        { message: 'Материал не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({ material })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Ошибка при получении материала' },
      { status: 500 }
    )
  }
}

// PUT - обновить материал
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const body = await request.json()
    const data = updateMaterialSchema.parse(body)

    // Проверяем, существует ли материал
    const existingMaterial = await prisma.material.findUnique({
      where: { id: params.id },
    })

    if (!existingMaterial) {
      return NextResponse.json(
        { message: 'Материал не найден' },
        { status: 404 }
      )
    }

    // Если меняется раздел, проверяем его существование
    if (data.sectionId && data.sectionId !== existingMaterial.sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: data.sectionId },
      })

      if (!section) {
        return NextResponse.json(
          { message: 'Раздел не найден' },
          { status: 404 }
        )
      }
    }

    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        ...(data.sectionId && { sectionId: data.sectionId }),
        ...(data.title && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.type && { type: data.type }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.audioUrl !== undefined && { audioUrl: data.audioUrl }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
        ...(data.fileName !== undefined && { fileName: data.fileName }),
        ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
        ...(data.order !== undefined && { order: data.order }),
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
      message: 'Материал успешно обновлен',
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

    console.error('Update material error:', error)
    return NextResponse.json(
      { message: 'Ошибка при обновлении материала' },
      { status: 500 }
    )
  }
}

// DELETE - удалить материал
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const material = await prisma.material.findUnique({
      where: { id: params.id },
    })

    if (!material) {
      return NextResponse.json(
        { message: 'Материал не найден' },
        { status: 404 }
      )
    }

    await prisma.material.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Материал успешно удален',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Delete material error:', error)
    return NextResponse.json(
      { message: 'Ошибка при удалении материала' },
      { status: 500 }
    )
  }
}

