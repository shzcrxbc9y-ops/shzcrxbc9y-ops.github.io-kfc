import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import UserDeleteButton from '@/components/UserDeleteButton'

export default async function AdminUsersPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const users = await prisma.user.findMany({
    include: {
      progress: true,
      _count: {
        select: {
          testResults: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Статистика
  const totalUsers = users.length
  const adminUsers = users.filter(u => u.role === 'ADMIN').length
  const employeeUsers = users.filter(u => u.role === 'EMPLOYEE').length
  const mentorUsers = users.filter(u => u.role === 'MENTOR').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
              >
                ← Назад в админ-панель
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Управление пользователями</h1>
              <p className="text-gray-600 mt-1 text-sm">Управление сотрудниками и их доступом к системе</p>
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Всего пользователей</div>
            <div className="text-2xl font-bold text-gray-900">{totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Администраторы</div>
            <div className="text-2xl font-bold text-purple-600">{adminUsers}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Сотрудники</div>
            <div className="text-2xl font-bold text-blue-600">{employeeUsers}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Наставники</div>
            <div className="text-2xl font-bold text-green-600">{mentorUsers}</div>
          </div>
        </div>

        {/* Список пользователей */}
        {users.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет пользователей</h3>
            <p className="text-gray-600">Пользователи появятся после регистрации</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Список пользователей</h2>
              <p className="text-sm text-gray-600 mt-1">Все зарегистрированные пользователи системы</p>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Прогресс
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Тесты
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Дата регистрации
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.position && (
                            <div className="text-xs text-gray-400 mt-1">{user.position}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'MENTOR'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {user.role === 'ADMIN'
                            ? 'Администратор'
                            : user.role === 'MENTOR'
                            ? 'Наставник'
                            : 'Сотрудник'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <span>Уровень: <strong>{user.progress?.level || 1}</strong></span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Опыт: {user.progress?.experience || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <span className="font-medium">{user._count.testResults}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <UserDeleteButton
                          userId={user.id}
                          userName={`${user.firstName} ${user.lastName}`}
                          userRole={user.role}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-medium text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      {user.position && (
                        <div className="text-xs text-gray-400 mt-1">{user.position}</div>
                      )}
                    </div>
                    <span
                      className={`ml-2 px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : user.role === 'MENTOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'Админ' : user.role === 'MENTOR' ? 'Наставник' : 'Сотрудник'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Прогресс:</span>
                      <span className="font-medium text-gray-900">
                        Уровень {user.progress?.level || 1}, {user.progress?.sectionsCompleted || 0} разделов
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Тесты:</span>
                      <span className="font-medium text-gray-900">
                        {user._count.testResults} пройдено
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Регистрация:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                  {user.role !== 'ADMIN' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <UserDeleteButton
                        userId={user.id}
                        userName={`${user.firstName} ${user.lastName}`}
                        userRole={user.role}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

