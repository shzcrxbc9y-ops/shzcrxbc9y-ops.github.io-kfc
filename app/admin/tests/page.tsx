import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function AdminTestsPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const tests = await prisma.test.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
      _count: {
        select: {
          questions: true,
          results: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </Link>
        <h1 className="text-3xl font-bold">Управление тестами</h1>
        <div></div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Внимание:</strong> Функционал создания и редактирования тестов будет добавлен в следующей версии.
          Сейчас вы можете управлять тестами через Prisma Studio или напрямую в базе данных.
        </p>
      </div>

      <div className="space-y-4">
        {tests.map((test) => (
          <div key={test.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{test.title}</h2>
                {test.description && (
                  <p className="text-gray-600 mb-2">{test.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>
                    {test.section.station?.name} → {test.section.title}
                  </span>
                  <span>{test._count.questions} вопросов</span>
                  <span>{test._count.results} прохождений</span>
                </div>
              </div>
              {test.isCertification && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                  Сертификация
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Проходной балл:</span>
                <span className="ml-2 font-semibold">{test.passingScore}%</span>
              </div>
              {test.timeLimit && (
                <div>
                  <span className="text-gray-600">Лимит времени:</span>
                  <span className="ml-2 font-semibold">{test.timeLimit} мин.</span>
                </div>
              )}
              <div>
                <span className="text-gray-600">Создан:</span>
                <span className="ml-2 font-semibold">{formatDate(test.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

