import { getCurrentUser } from '@/lib/auth'
import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { MaterialItem } from '@/components/MaterialItem'

export default async function AdminMaterialsPage() {
  try {
    await requireAuth('ADMIN')
  } catch {
    redirect('/dashboard')
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
        <h1 className="text-3xl font-bold">Управление материалами</h1>
        <Link
          href="/admin/materials/new"
          className="inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Создать материал</span>
        </Link>
      </div>

      <div className="space-y-6">
        {stations.map((station) => (
          <div key={station.id} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">{station.name}</h2>
            {station.description && (
              <p className="text-gray-600 mb-4">{station.description}</p>
            )}

            {station.sections.length === 0 ? (
              <p className="text-gray-500">Разделы не добавлены</p>
            ) : (
              <div className="space-y-4">
                {station.sections.map((section) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-medium">{section.title}</h3>
                      <span className="text-sm text-gray-500">
                        {section._count.materials} материалов
                      </span>
                    </div>
                    {section.description && (
                      <p className="text-gray-600 mb-3">{section.description}</p>
                    )}

                    {section.materials.length > 0 && (
                      <div className="space-y-2">
                        {section.materials.map((material) => (
                          <MaterialItem key={material.id} material={material} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

