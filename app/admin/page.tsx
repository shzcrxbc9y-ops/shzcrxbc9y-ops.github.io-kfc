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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Административная панель</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <AdminCard
          icon={<Building2 className="w-6 h-6" />}
          title="Станции"
          description="Управление станциями работы"
          href="/admin/stations"
        />
        <AdminCard
          icon={<FolderTree className="w-6 h-6" />}
          title="Разделы"
          description="Управление разделами обучения"
          href="/admin/sections"
        />
        <AdminCard
          icon={<BookOpen className="w-6 h-6" />}
          title="Материалы"
          description="Управление обучающими материалами"
          href="/admin/materials"
        />
        <AdminCard
          icon={<Users className="w-6 h-6" />}
          title="Пользователи"
          description="Управление сотрудниками"
          href="/admin/users"
        />
        <AdminCard
          icon={<Award className="w-6 h-6" />}
          title="Тесты"
          description="Создание и редактирование тестов"
          href="/admin/tests"
        />
        <AdminCard
          icon={<BarChart3 className="w-6 h-6" />}
          title="Статистика"
          description="Аналитика и отчеты"
          href="/admin/statistics"
        />
      </div>
    </div>
  )
}

function AdminCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  )
}

