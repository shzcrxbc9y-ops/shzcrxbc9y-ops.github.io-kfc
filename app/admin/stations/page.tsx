import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { StationItem } from '@/components/StationItem'

export default async function AdminStationsPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const stations = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          _count: {
            select: { materials: true },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: { sections: true },
      },
    },
    orderBy: { order: 'asc' },
  })

  // Преобразуем данные для компонента
  const stationsWithFullSections = stations.map((station) => ({
    ...station,
    sections: station.sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      order: section.order,
      _count: section._count,
    })),
  }))

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
        <h1 className="text-3xl font-bold">Управление станциями</h1>
        <Link
          href="/admin/stations/new"
          className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Создать станцию</span>
        </Link>
      </div>

      {stations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Станции не созданы. Создайте первую станцию.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stationsWithFullSections.map((station) => (
            <StationItem key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  )
}

