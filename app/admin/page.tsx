import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, BookOpen, Award, BarChart3, Building2, FolderTree } from 'lucide-react'

export default async function AdminPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Административная панель</h1>
          <p className="text-sm sm:text-base text-gray-600">Управление системой обучения и контентом</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <AdminCard
            icon={<BookOpen className="w-7 h-7" />}
            title="Управление контентом"
            description="Станции, разделы и материалы в одном месте"
            href="/admin/content"
            accent="blue"
          />
          <AdminCard
            icon={<Users className="w-7 h-7" />}
            title="Пользователи"
            description="Управление сотрудниками и их доступом"
            href="/admin/users"
            accent="green"
          />
          <AdminCard
            icon={<Award className="w-7 h-7" />}
            title="Тесты"
            description="Создание и редактирование тестов и вопросов"
            href="/admin/tests"
            accent="purple"
          />
          <AdminCard
            icon={<BarChart3 className="w-7 h-7" />}
            title="Статистика"
            description="Аналитика, отчеты и метрики системы"
            href="/admin/statistics"
            accent="orange"
          />
        </div>
      </div>
    </div>
  )
}

function AdminCard({
  icon,
  title,
  description,
  href,
  accent = 'blue',
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  accent?: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const accentColors = {
    blue: {
      border: 'border-blue-500',
      icon: 'text-blue-600',
      hover: 'hover:border-blue-600',
      bg: 'bg-blue-50',
    },
    green: {
      border: 'border-green-500',
      icon: 'text-green-600',
      hover: 'hover:border-green-600',
      bg: 'bg-green-50',
    },
    purple: {
      border: 'border-purple-500',
      icon: 'text-purple-600',
      hover: 'hover:border-purple-600',
      bg: 'bg-purple-50',
    },
    orange: {
      border: 'border-orange-500',
      icon: 'text-orange-600',
      hover: 'hover:border-orange-600',
      bg: 'bg-orange-50',
    },
  }

  const colors = accentColors[accent]

  return (
    <Link
      href={href}
      className={`group bg-white rounded-lg border-l-4 ${colors.border} ${colors.hover} shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6 block`}
    >
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className={`flex-shrink-0 ${colors.icon} ${colors.bg} rounded-lg p-2 sm:p-3`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  )
}

