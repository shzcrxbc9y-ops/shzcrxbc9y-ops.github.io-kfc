import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { StationCard } from '@/components/StationCard'

export default async function LearningPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const stations = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          materials: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { materials: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  })

  // Подсчет общего количества материалов
  const totalMaterials = stations.reduce((sum, station) => 
    sum + station.sections.reduce((s, section) => s + section._count.materials, 0), 0
  )


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Обучающие материалы</h1>
              <p className="text-sm sm:text-base text-gray-600">Изучайте материалы, развивайте навыки и повышайте квалификацию</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900">{totalMaterials}</div>
              <div className="text-xs sm:text-sm text-gray-600">материалов</div>
            </div>
          </div>
        </div>

        {stations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Материалы пока не добавлены</h3>
            <p className="text-gray-600">Обратитесь к администратору для добавления обучающих материалов.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {stations.map((station) => {
              const stationMaterialsCount = station.sections.reduce(
                (sum, section) => sum + section._count.materials, 0
              )

              return (
                <StationCard
                  key={station.id}
                  station={station}
                  stationMaterialsCount={stationMaterialsCount}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

