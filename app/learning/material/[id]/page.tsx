import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, FolderTree, Play, Image as ImageIcon, Music, FileText, File, BookOpen, ChevronRight } from 'lucide-react'

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      section: {
        include: {
          station: true,
          materials: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
      },
    },
  })

  if (!material) {
    notFound()
  }

  const getMaterialIcon = (type: string) => {
    const iconClass = "w-5 h-5"
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

  const getMaterialTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Видео'
      case 'audio':
        return 'Аудио'
      case 'image':
        return 'Изображение'
      case 'pdf':
        return 'PDF документ'
      case 'file':
        return 'Файл'
      default:
        return 'Текст'
    }
  }

  // Находим текущий индекс материала и соседние материалы
  const currentIndex = material.section.materials.findIndex(m => m.id === material.id)
  const prevMaterial = currentIndex > 0 ? material.section.materials[currentIndex - 1] : null
  const nextMaterial = currentIndex < material.section.materials.length - 1 
    ? material.section.materials[currentIndex + 1] 
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-6xl">
        {/* Хлебные крошки */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/learning" className="hover:text-gray-900 transition-colors">
            Обучающие материалы
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link 
            href={`/learning?station=${material.section.station?.id}`}
            className="hover:text-gray-900 transition-colors"
          >
            {material.section.station?.name || 'Станция'}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{material.title}</span>
        </nav>

        {/* Кнопка назад */}
        <Link
          href="/learning"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад к материалам</span>
        </Link>

        {/* Основной контент */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Заголовок */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 md:p-8">
            <div className="flex items-start space-x-4 mb-4">
              <div className="flex-shrink-0">
                {getMaterialIcon(material.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-3 py-1 bg-white rounded-md text-sm font-medium text-gray-700">
                    {getMaterialTypeLabel(material.type)}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{material.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-4 h-4" />
                    <span>{material.section.station?.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                  <div className="flex items-center space-x-1">
                    <FolderTree className="w-4 h-4" />
                    <span>{material.section.title}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 lg:p-8">

        {/* Видео */}
        {material.type === 'video' && material.videoUrl && (
          <div className="mb-8">
            <div className="w-full max-w-5xl mx-auto">
              <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4 flex items-center justify-center">
                <video
                  src={material.videoUrl}
                  controls
                  className="w-full h-full object-cover"
                  preload="metadata"
                >
                  Ваш браузер не поддерживает видео.
                  <a href={material.videoUrl} download>Скачать видео</a>
                </video>
              </div>
            </div>
            {/* Дополнительные видео */}
            {(() => {
              try {
                const contentData = JSON.parse(material.content || '{}')
                if (contentData.additionalFiles) {
                  const additionalVideos = contentData.additionalFiles.filter((f: any) => f.type?.includes('video'))
                  if (additionalVideos.length > 0) {
                    return (
                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        {additionalVideos.map((file: any, index: number) => (
                          <div key={index} className="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                            <video
                              src={file.url}
                              controls
                              className="w-full h-full object-cover"
                              preload="metadata"
                            >
                              Ваш браузер не поддерживает видео.
                            </video>
                          </div>
                        ))}
                      </div>
                    )
                  }
                }
              } catch {}
              return null
            })()}
          </div>
        )}

        {/* Аудио */}
        {material.type === 'audio' && material.audioUrl && (
          <div className="mb-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <audio
                    src={material.audioUrl}
                    controls
                    className="w-full"
                    preload="metadata"
                  >
                    Ваш браузер не поддерживает аудио.
                    <a href={material.audioUrl} download>Скачать аудио</a>
                  </audio>
                </div>
                {material.fileName && (
                  <a
                    href={material.audioUrl}
                    download
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium"
                  >
                    Скачать
                  </a>
                )}
              </div>
              {material.fileName && (
                <p className="text-sm text-gray-600 mt-2">
                  Файл: {material.fileName}
                  {material.fileSize && ` (${(material.fileSize / 1024 / 1024).toFixed(2)} MB)`}
                </p>
              )}
            </div>
            {/* Дополнительные аудио */}
            {(() => {
              try {
                const contentData = JSON.parse(material.content || '{}')
                if (contentData.additionalFiles) {
                  const additionalAudio = contentData.additionalFiles.filter((f: any) => f.type?.includes('audio'))
                  if (additionalAudio.length > 0) {
                    return (
                      <div className="space-y-3">
                        {additionalAudio.map((file: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <audio
                              src={file.url}
                              controls
                              className="w-full"
                              preload="metadata"
                            >
                              Ваш браузер не поддерживает аудио.
                            </audio>
                            <p className="text-xs text-gray-600 mt-2">
                              {file.fileName} {file.fileSize && `(${(file.fileSize / 1024 / 1024).toFixed(2)} MB)`}
                            </p>
                          </div>
                        ))}
                      </div>
                    )
                  }
                }
              } catch {}
              return null
            })()}
          </div>
        )}

        {/* Изображение */}
        {material.type === 'image' && material.imageUrl && (
          <div className="mb-8">
            <div className="mb-6">
              <div className="w-full">
                <div className="w-full aspect-square md:aspect-video rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={material.imageUrl}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            {/* Дополнительные изображения */}
            {(() => {
              try {
                const contentData = JSON.parse(material.content || '{}')
                if (contentData.additionalFiles) {
                  const additionalImages = contentData.additionalFiles.filter((f: any) => f.type?.includes('image'))
                  if (additionalImages.length > 0) {
                    return (
                      <div className="grid md:grid-cols-2 gap-6 mt-6">
                        {additionalImages.map((file: any, index: number) => (
                          <div key={index} className="w-full aspect-square md:aspect-video rounded-lg overflow-hidden shadow-lg">
                            <img
                              src={file.url}
                              alt={`${material.title} - изображение ${index + 2}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )
                  }
                }
              } catch {}
              return null
            })()}
          </div>
        )}

        {/* PDF или файл */}
        {(material.type === 'pdf' || material.type === 'file') && material.fileUrl && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h3 className="font-semibold text-base md:text-lg mb-1">
                  {material.type === 'pdf' ? 'PDF документ' : 'Файл'}
                </h3>
                {material.fileName && (
                  <p className="text-xs md:text-sm text-gray-600 break-words">
                    {material.fileName}
                    {material.fileSize && ` (${(material.fileSize / 1024 / 1024).toFixed(2)} MB)`}
                  </p>
                )}
              </div>
              <a
                href={material.fileUrl}
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium text-sm md:text-base whitespace-nowrap"
              >
                Скачать
              </a>
            </div>
            {material.type === 'pdf' ? (
              <div className="w-full aspect-square md:aspect-[4/3] border rounded-lg overflow-hidden bg-white">
                <iframe
                  src={material.fileUrl}
                  className="w-full h-full border-0"
                  title={material.title}
                >
                  <p>
                    Ваш браузер не поддерживает просмотр PDF.
                    <a href={material.fileUrl} download>Скачайте файл</a> для просмотра.
                  </p>
                </iframe>
              </div>
            ) : (
              <div className="text-center py-6 md:py-8 bg-white rounded border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-4 text-sm md:text-base">Файл готов к скачиванию</p>
                <a
                  href={material.fileUrl}
                  download
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md font-medium text-sm md:text-base"
                >
                  Скачать файл
                </a>
              </div>
            )}
          </div>
        )}

        {/* Текстовый контент */}
        {material.content && (() => {
          try {
            const contentData = JSON.parse(material.content)
            if (contentData.text) {
              return (
                <div
                  className="prose prose-lg max-w-none mt-8"
                  dangerouslySetInnerHTML={{ __html: contentData.text }}
                />
              )
            }
          } catch {
            // Если не JSON, значит обычный текст
            return (
              <div
                className="prose prose-lg max-w-none mt-8"
                dangerouslySetInnerHTML={{ __html: material.content }}
              />
            )
          }
        })()}

            {/* Навигация между материалами */}
            {(prevMaterial || nextMaterial) && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  {prevMaterial ? (
                    <Link
                      href={`/learning/material/${prevMaterial.id}`}
                      className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors group flex-1 max-w-[45%]"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500 mb-1">Предыдущий материал</div>
                        <div className="font-medium truncate">{prevMaterial.title}</div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex-1"></div>
                  )}
                  
                  {nextMaterial && (
                    <Link
                      href={`/learning/material/${nextMaterial.id}`}
                      className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors group flex-1 max-w-[45%] text-right"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-gray-500 mb-1">Следующий материал</div>
                        <div className="font-medium truncate">{nextMaterial.title}</div>
                      </div>
                      <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

