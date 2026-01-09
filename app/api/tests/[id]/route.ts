import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 })
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { order: 'asc' },
        },
        section: {
          include: {
            station: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ message: 'Тест не найден' }, { status: 404 })
    }

    // Убираем правильные ответы из опций
    const testWithoutAnswers = {
      ...test,
      questions: test.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
        })),
      })),
    }

    return NextResponse.json({ test: testWithoutAnswers })
  } catch (error) {
    console.error('Error fetching test:', error)
    return NextResponse.json(
      { message: 'Ошибка загрузки теста' },
      { status: 500 }
    )
  }
}

