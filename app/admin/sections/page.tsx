import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { SectionItem } from '@/components/SectionItem'

export default async function AdminSectionsPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
  }

  const sections = await prisma.section.findMany({
    include: {
      station: true,
      _count: {
        select: { materials: true },
      },
    },
    orderBy: [
      { stationId: 'asc' },
      { order: 'asc' },
    ],
  })

  // Группируем разделы по станциям
  const sectionsByStation = sections.reduce((acc, section) => {
    const stationId = section.stationId || 'no-station'
    if (!acc[stationId]) {
      acc[stationId] = {
        station: section.station,
        sections: [],
      }
    }
    acc[stationId].sections.push(section)
    return acc
  }, {} as Record<string, { station: any; sections: any[] }>)

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
        <h1 className="text-3xl font-bold">Управление разделами</h1>
        <Link
          href="/admin/sections/new"
          className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Создать раздел</span>
        </Link>
      </div>

      {sections.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Разделы не созданы. Создайте первый раздел.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(sectionsByStation).map(({ station, sections }) => (
            <div key={station?.id || 'no-station'} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {station?.name || 'Без станции'}
              </h2>
              <div className="space-y-2">
                {sections.map((section) => (
                  <SectionItem key={section.id} section={section} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

