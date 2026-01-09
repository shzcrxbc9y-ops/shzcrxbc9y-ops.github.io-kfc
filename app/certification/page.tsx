import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Award, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function CertificationPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const stations = await prisma.station.findMany({
    include: {
      certifications: {
        where: { userId: user.id },
      },
      sections: {
        include: {
          tests: {
            where: { isCertification: true },
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Сертификация</h1>

      {stations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Станции сертификации пока не добавлены.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {stations.map((station) => {
            const certification = station.certifications[0]
            const certificationTest = station.sections
              .flatMap((s) => s.tests)
              .find((t) => t.isCertification)

            return (
              <div
                key={station.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary-600"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">{station.name}</h2>
                    {station.description && (
                      <p className="text-gray-600 mb-4">{station.description}</p>
                    )}
                  </div>
                  {certification?.status === 'PASSED' && (
                    <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                  )}
                  {certification?.status === 'FAILED' && (
                    <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  )}
                  {certification?.status === 'IN_PROGRESS' && (
                    <Clock className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Статус:</span>
                    <span
                      className={`font-semibold ${
                        certification?.status === 'PASSED'
                          ? 'text-green-600'
                          : certification?.status === 'FAILED'
                          ? 'text-red-600'
                          : certification?.status === 'IN_PROGRESS'
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {certification?.status === 'PASSED'
                        ? 'Пройдена'
                        : certification?.status === 'FAILED'
                        ? 'Не пройдена'
                        : certification?.status === 'IN_PROGRESS'
                        ? 'В процессе'
                        : 'Не начата'}
                    </span>
                  </div>
                  {certification?.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Результат:</span>
                      <span className="font-semibold">{certification.score}%</span>
                    </div>
                  )}
                  {certification?.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Дата завершения:</span>
                      <span className="font-semibold">
                        {formatDate(certification.completedAt)}
                      </span>
                    </div>
                  )}
                </div>

                {certificationTest ? (
                  <Link
                    href={`/tests/${certificationTest.id}`}
                    className={`inline-block w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                      certification?.status === 'PASSED'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {certification?.status === 'PASSED'
                      ? 'Просмотреть результаты'
                      : certification?.status === 'FAILED'
                      ? 'Повторить сертификацию'
                      : 'Начать сертификацию'}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-500">
                    Тест для сертификации еще не создан
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

