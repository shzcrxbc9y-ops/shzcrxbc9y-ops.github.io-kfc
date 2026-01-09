import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { z } from 'zod'

const submitSchema = z.object({
  answers: z.record(z.string(), z.array(z.string())),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = submitSchema.parse(body)

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    })

    if (!test) {
      return NextResponse.json({ message: 'Тест не найден' }, { status: 404 })
    }

    // Проверяем ответы
    let correctAnswers = 0
    const answerRecords = []

    for (const question of test.questions) {
      const selectedOptionIds = data.answers[question.id] || []
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort()

      const selectedSorted = [...selectedOptionIds].sort()
      const isCorrect =
        selectedSorted.length === correctOptionIds.length &&
        selectedSorted.every((id, index) => id === correctOptionIds[index])

      if (isCorrect) {
        correctAnswers++
      }

      answerRecords.push({
        questionId: question.id,
        optionIds: JSON.stringify(selectedOptionIds),
        isCorrect,
      })
    }

    const score = Math.round((correctAnswers / test.questions.length) * 100)
    const isPassed = score >= test.passingScore

    // Создаем или обновляем результат теста
    const testResult = await prisma.testResult.create({
      data: {
        userId: user.id,
        testId: params.id,
        score,
        status: isPassed ? 'PASSED' : 'FAILED',
        completedAt: new Date(),
        answers: {
          create: answerRecords,
        },
      },
      include: {
        answers: true,
      },
    })

    // Обновляем прогресс пользователя
    const progress = await prisma.progress.findUnique({
      where: { userId: user.id },
    })

    if (progress) {
      await prisma.progress.update({
        where: { userId: user.id },
        data: {
          testsCompleted: progress.testsCompleted + 1,
          totalScore: progress.totalScore + score,
        },
      })
    }

    // Если это сертификационный тест, обновляем сертификацию
    if (test.isCertification) {
      const section = await prisma.section.findUnique({
        where: { id: test.sectionId },
        include: {
          station: true,
        },
      })

      if (section?.station) {
        const existing = await prisma.certification.findUnique({
          where: {
            userId_stationId: {
              userId: user.id,
              stationId: section.station.id,
            },
          },
        })

        if (existing) {
          await prisma.certification.update({
            where: { id: existing.id },
            data: {
              status: isPassed ? 'PASSED' : 'FAILED',
              score: isPassed ? score : null,
              completedAt: isPassed ? new Date() : null,
            },
          })
        } else {
          await prisma.certification.create({
            data: {
              userId: user.id,
              stationId: section.station.id,
              status: isPassed ? 'PASSED' : 'FAILED',
              score: isPassed ? score : null,
              completedAt: isPassed ? new Date() : null,
            },
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Тест завершен',
      result: {
        score,
        isPassed,
        correctAnswers,
        totalQuestions: test.questions.length,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Неверные данные', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting test:', error)
    return NextResponse.json(
      { message: 'Ошибка отправки теста' },
      { status: 500 }
    )
  }
}

