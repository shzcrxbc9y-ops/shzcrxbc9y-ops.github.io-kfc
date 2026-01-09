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
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Добро пожаловать в платформу обучения KFC
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Изучайте корпоративные стандарты, проходите тестирование и получайте сертификацию
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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
        <FeatureCard
          icon={<Users className="w-8 h-8" />}
          title="Сертификация"
          description="Проходите итоговую сертификацию для допуска к работе"
          href="/certification"
        />
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Начните обучение прямо сейчас</h2>
        <p className="text-gray-600 mb-6">
          Наша платформа поможет вам быстро освоить все необходимые навыки для работы в KFC.
          Пройдите обучение по станциям, сдайте тесты и получите сертификацию.
        </p>
        <Link
          href="/learning"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
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
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="text-primary-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  )
}

