import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - получить все результаты теста
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth('ADMIN')

    const testId = params.id

    // Проверяем, существует ли тест
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        section: {
          include: {
            station: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json(
        { message: 'Тест не найден' },
        { status: 404 }
      )
    }

    // Получаем все результаты теста
    const results = await prisma.testResult.findMany({
      where: { testId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        _count: {
          select: {
            answers: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    // Статистика - безопасный расчет
    const totalResults = results.length || 0
    const completedResults = results.filter(r => r.status && (r.status === 'PASSED' || r.status === 'FAILED' || r.status === 'COMPLETED'))
    const passedResults = results.filter(r => r.status === 'PASSED').length || 0
    const failedResults = results.filter(r => r.status === 'FAILED').length || 0
    const inProgressResults = results.filter(r => r.status === 'IN_PROGRESS').length || 0
    
    // Средний балл только для завершенных тестов с валидным score
    const validScores = completedResults.filter(r => 
      r.score !== null && 
      r.score !== undefined && 
      typeof r.score === 'number' && 
      !isNaN(r.score) && 
      r.score >= 0 && 
      r.score <= 100
    )
    const averageScore = validScores.length > 0
      ? Math.round(validScores.reduce((sum, r) => sum + (r.score || 0), 0) / validScores.length)
      : 0
    
    // Процент успеха
    const passRate = completedResults.length > 0
      ? Math.round((passedResults / completedResults.length) * 100)
      : 0

    return NextResponse.json({
      test,
      results,
      statistics: {
        total: totalResults,
        completed: completedResults.length,
        passed: passedResults,
        failed: failedResults,
        inProgress: inProgressResults,
        averageScore,
        passRate,
        validScoresCount: validScores.length,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    console.error('Get test results error:', error)
    return NextResponse.json(
      { message: 'Ошибка при получении результатов' },
      { status: 500 }
    )
  }
}
