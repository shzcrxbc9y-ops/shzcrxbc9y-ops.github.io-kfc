import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Play, Image as ImageIcon, Music, File } from 'lucide-react'

export default async function LearningPage() {
  const user = await getCurrentUser()
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Обучающие материалы</h1>

      {stations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">Материалы пока не добавлены. Обратитесь к администратору.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {stations.map((station) => (
            <div key={station.id} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">{station.name}</h2>
              {station.description && (
                <p className="text-gray-600 mb-6">{station.description}</p>
              )}

              {station.sections.length === 0 ? (
                <p className="text-gray-500">Разделы пока не добавлены</p>
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
                        <p className="text-gray-600 mb-4">{section.description}</p>
                      )}

                      {section.materials.length > 0 && (
                        <div className="grid md:grid-cols-2 gap-3">
                          {section.materials.map((material) => {
                            const getIcon = () => {
                              switch (material.type) {
                                case 'video':
                                  return <Play className="w-5 h-5 text-primary-600" />
                                case 'audio':
                                  return <Music className="w-5 h-5 text-primary-600" />
                                case 'image':
                                  return <ImageIcon className="w-5 h-5 text-primary-600" />
                                case 'pdf':
                                case 'file':
                                  return <File className="w-5 h-5 text-primary-600" />
                                default:
                                  return <BookOpen className="w-5 h-5 text-primary-600" />
                              }
                            }

                            return (
                              <Link
                                key={material.id}
                                href={`/learning/material/${material.id}`}
                                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                {getIcon()}
                                <span className="flex-1">{material.title}</span>
                                <span className="text-xs text-gray-500 capitalize">{material.type}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

