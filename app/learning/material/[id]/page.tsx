import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    redirect('/login')
  }
  
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  })

  if (!material) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/learning"
        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Назад к материалам</span>
      </Link>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-4">{material.title}</h1>

        {/* Видео */}
        {material.type === 'video' && material.videoUrl && (
          <div className="mb-6">
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <video
                src={material.videoUrl}
                controls
                className="w-full h-full"
                preload="metadata"
              >
                Ваш браузер не поддерживает видео.
                <a href={material.videoUrl} download>Скачать видео</a>
              </video>
            </div>
          </div>
        )}

        {/* Аудио */}
        {material.type === 'audio' && material.audioUrl && (
          <div className="mb-6 bg-gray-50 rounded-lg p-6">
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
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
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
        )}

        {/* Изображение */}
        {material.type === 'image' && material.imageUrl && (
          <div className="mb-6">
            <img
              src={material.imageUrl}
              alt={material.title}
              className="w-full rounded-lg shadow-md"
            />
          </div>
        )}

        {/* PDF или файл */}
        {(material.type === 'pdf' || material.type === 'file') && material.fileUrl && (
          <div className="mb-6 bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {material.type === 'pdf' ? 'PDF документ' : 'Файл'}
                </h3>
                {material.fileName && (
                  <p className="text-sm text-gray-600">
                    {material.fileName}
                    {material.fileSize && ` (${(material.fileSize / 1024 / 1024).toFixed(2)} MB)`}
                  </p>
                )}
              </div>
              <a
                href={material.fileUrl}
                download
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Скачать
              </a>
            </div>
            {material.type === 'pdf' ? (
              <iframe
                src={material.fileUrl}
                className="w-full h-[600px] border rounded-lg"
                title={material.title}
              >
                <p>
                  Ваш браузер не поддерживает просмотр PDF.
                  <a href={material.fileUrl} download>Скачайте файл</a> для просмотра.
                </p>
              </iframe>
            ) : (
              <div className="text-center py-8 bg-white rounded border-2 border-dashed border-gray-300">
                <p className="text-gray-600 mb-4">Файл готов к скачиванию</p>
                <a
                  href={material.fileUrl}
                  download
                  className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Скачать файл
                </a>
              </div>
            )}
          </div>
        )}

        {/* Текстовый контент */}
        {material.content && (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: material.content }}
          />
        )}
      </div>
    </div>
  )
}

