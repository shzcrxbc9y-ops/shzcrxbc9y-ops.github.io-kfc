import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Award, BarChart3, Users } from 'lucide-react'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    redirect('/login')
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
      <div className="text-center mb-8 sm:mb-12 lg:mb-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-4">
          Добро пожаловать в платформу обучения KFC
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
          Изучайте корпоративные стандарты и проходите тестирование для проверки знаний
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12 lg:mb-16">
        <FeatureCard
          icon={<BookOpen className="w-8 h-8" />}
          title="Обучающие материалы"
          description="Изучайте правила, инструкции и стандарты работы в KFC"
          href="/learning"
        />
        <FeatureCard
          icon={<Award className="w-8 h-8" />}
          title="Тестирование"
          description="Проверяйте свои знания с помощью интерактивных тестов"
          href="/tests"
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="Прогресс"
          description="Отслеживайте свой прогресс обучения и достижения"
          href="/dashboard"
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-4xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Начните обучение прямо сейчас</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          Наша платформа поможет вам быстро освоить все необходимые навыки для работы в KFC.
          Пройдите обучение по станциям и сдайте тесты для проверки знаний.
        </p>
        <Link
          href="/learning"
          className="inline-block bg-primary-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm sm:text-base w-full sm:w-auto text-center"
        >
          Начать обучение
        </Link>
      </div>
    </div>
  )
}

function FeatureCard({
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
      className="bg-white rounded-lg shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow"
    >
      <div className="text-primary-600 mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-gray-600">{description}</p>
    </Link>
  )
}

