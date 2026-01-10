import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE - удалить пользователя
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')
    const currentUser = await getCurrentUser()

    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Нельзя удалить самого себя
    if (currentUser && user.id === currentUser.id) {
      return NextResponse.json(
        { message: 'Нельзя удалить самого себя' },
        { status: 400 }
      )
    }

    // Нельзя удалить другого администратора
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { message: 'Нельзя удалить администратора' },
        { status: 400 }
      )
    }

    // Удаляем связанные данные (каскадное удаление)
    // Prisma автоматически удалит связанные записи благодаря onDelete: Cascade в схеме
    // Но для безопасности удаляем вручную:
    
    // Удаляем прогресс
    await prisma.progress.deleteMany({
      where: { userId: params.id },
    })

    // Удаляем достижения пользователя
    await prisma.userAchievement.deleteMany({
      where: { userId: params.id },
    })

    // Удаляем сертификации
    await prisma.certification.deleteMany({
      where: { userId: params.id },
    })

    // Удаляем ответы на тесты
    const testResults = await prisma.testResult.findMany({
      where: { userId: params.id },
    })
    
    for (const result of testResults) {
      await prisma.answer.deleteMany({
        where: { testResultId: result.id },
      })
    }

    // Удаляем результаты тестов
    await prisma.testResult.deleteMany({
      where: { userId: params.id },
    })

    // Удаляем пользователя
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Пользователь успешно удален',
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Delete user error:', error)
    return NextResponse.json(
      { message: error.message || 'Ошибка при удалении пользователя' },
      { status: 500 }
    )
  }
}
