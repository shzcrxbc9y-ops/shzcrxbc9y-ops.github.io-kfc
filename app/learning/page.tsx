import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Play, Image as ImageIcon, Music, File, FileText, Building2, FolderTree, ChevronRight, Search } from 'lucide-react'

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

  const getMaterialIcon = (type: string) => {
    const iconClass = "w-6 h-6"
    switch (type) {
      case 'video':
        return <Play className={iconClass} />
      case 'audio':
        return <Music className={iconClass} />
      case 'image':
        return <ImageIcon className={iconClass} />
      case 'pdf':
        return <FileText className={iconClass} />
      case 'file':
        return <File className={iconClass} />
      default:
        return <BookOpen className={iconClass} />
    }
  }

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30'
      case 'audio':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
      case 'image':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
      case 'pdf':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30'
      case 'file':
        return 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      default:
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Обучающие материалы</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Изучайте материалы, развивайте навыки и повышайте квалификацию</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalMaterials}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">материалов</div>
            </div>
          </div>
        </div>

        {stations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Материалы пока не добавлены</h3>
            <p className="text-gray-600 dark:text-gray-300">Обратитесь к администратору для добавления обучающих материалов.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {stations.map((station) => {
              const stationMaterialsCount = station.sections.reduce(
                (sum, section) => sum + section._count.materials, 0
              )

              return (
                <div key={station.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Заголовок станции */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{station.name}</h2>
                        {station.description && (
                          <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 mb-3">{station.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center space-x-1">
                            <FolderTree className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{station.sections.length} разделов</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{stationMaterialsCount} материалов</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Разделы */}
                  {station.sections.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      Разделы пока не добавлены
                    </div>
                  ) : (
                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                      {station.sections.map((section) => (
                        <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-5 bg-gray-50 dark:bg-gray-700/50">
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{section.title}</h3>
                              {section.description && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">{section.description}</p>
                              )}
                              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span>{section._count.materials} {section._count.materials === 1 ? 'материал' : 'материалов'}</span>
                              </div>
                            </div>
                          </div>

                          {section.materials.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
                              {section.materials.map((material) => (
                                <Link
                                  key={material.id}
                                  href={`/learning/material/${material.id}`}
                                  className={`group relative border-2 rounded-lg p-4 transition-all duration-200 ${getMaterialColor(material.type)}`}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                      {getMaterialIcon(material.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-200">
                                        {material.title}
                                      </h4>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <span className="text-xs font-medium px-2 py-1 bg-white/50 dark:bg-gray-800/50 rounded capitalize">
                                          {material.type === 'video' ? 'Видео' : 
                                           material.type === 'audio' ? 'Аудио' : 
                                           material.type === 'image' ? 'Изображение' : 
                                           material.type === 'pdf' ? 'PDF' : 
                                           material.type === 'file' ? 'Файл' : 'Текст'}
                                        </span>
                                      </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                              Материалы в этом разделе пока не добавлены
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

