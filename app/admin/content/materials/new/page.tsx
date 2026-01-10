'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, FileText, Video, Image, Music, File, Plus, Trash2 } from 'lucide-react'
import RichTextEditor from '@/components/RichTextEditor'
import FileUploader from '@/components/FileUploader'

interface Station {
  id: string
  name: string
  sections: Section[]
}

interface Section {
  id: string
  title: string
  stationId: string
}

interface UploadedFile {
  url: string
  fileName: string
  fileSize: number
  fileType: string
}

function NewMaterialPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'video' | 'audio' | 'image' | 'pdf' | 'file',
    order: 0,
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])

  useEffect(() => {
    fetchStations()
    const sectionId = searchParams?.get('sectionId')
    if (sectionId) {
      setSelectedSection(sectionId)
    }
    
    // Восстанавливаем загруженные файлы из localStorage
    const savedFiles = localStorage.getItem('material_uploaded_files')
    if (savedFiles) {
      try {
        const files = JSON.parse(savedFiles)
        if (Array.isArray(files) && files.length > 0) {
          setUploadedFiles(files)
        }
      } catch (e) {
        console.error('Error restoring files:', e)
      }
    }
  }, [searchParams])

  // Сохраняем загруженные файлы в localStorage
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      localStorage.setItem('material_uploaded_files', JSON.stringify(uploadedFiles))
    } else {
      localStorage.removeItem('material_uploaded_files')
    }
  }, [uploadedFiles])

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/admin/stations')
      if (res.ok) {
        const data = await res.json()
        setStations(data.stations)
        // Если есть sectionId, находим станцию
        const sectionId = searchParams?.get('sectionId')
        if (sectionId && data.stations) {
          for (const station of data.stations) {
            const section = station.sections?.find((s: Section) => s.id === sectionId)
            if (section) {
              setSelectedStation(station.id)
              break
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching stations:', err)
    }
  }

  const handleMultipleFileUpload = async (files: FileList | null, fileType: string) => {
    if (!files || files.length === 0) return

    setUploading(true)
    setError('')
    const fileArray = Array.from(files)
    
    // Проверяем размер файлов на клиенте перед загрузкой
    const MAX_SIZE = 100 * 1024 * 1024 // 100MB
    const oversizedFiles = fileArray.filter(f => f.size > MAX_SIZE)
    if (oversizedFiles.length > 0) {
      setError(`Следующие файлы слишком большие (максимум 100MB): ${oversizedFiles.map(f => f.name).join(', ')}`)
      setUploading(false)
      return
    }
    
    const fileNames = fileArray.map(f => f.name)
    setUploadingFiles(fileNames)

    const successfullyUploaded: UploadedFile[] = []
    const errors: string[] = []

    // Загружаем файлы по одному через существующий endpoint
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const fileName = file.name

      try {
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileType', fileType)

        // Используем fetch с отслеживанием прогресса
        const xhr = new XMLHttpRequest()

        const uploadPromise = new Promise<UploadedFile>((resolve, reject) => {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = (e.loaded / e.total) * 100
              setUploadProgress(prev => ({ ...prev, [fileName]: percentComplete }))
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              try {
                const data = JSON.parse(xhr.responseText)
                if (data.url) {
                  resolve({
                    url: data.url,
                    fileName: data.fileName,
                    fileSize: data.fileSize,
                    fileType: data.fileType,
                  })
                } else {
                  reject(new Error('Файл не был загружен'))
                }
              } catch (e) {
                reject(new Error('Ошибка при обработке ответа'))
              }
            } else {
              try {
                const data = JSON.parse(xhr.responseText)
                // Используем детальное сообщение об ошибке от сервера
                const errorMsg = data.message || `Ошибка загрузки файла (код: ${xhr.status})`
                console.error('Upload error response:', data)
                reject(new Error(errorMsg))
              } catch (parseError) {
                console.error('Failed to parse error response:', xhr.responseText)
                reject(new Error(`Ошибка загрузки: ${xhr.status}. Ответ сервера: ${xhr.responseText.substring(0, 200)}`))
              }
            }
          })

          xhr.addEventListener('error', () => {
            let errorMsg = 'Ошибка сети при загрузке файла'
            try {
              if (xhr.responseText) {
                const errorData = JSON.parse(xhr.responseText)
                errorMsg = errorData.message || errorMsg
              }
            } catch {}
            reject(new Error(errorMsg))
          })

          xhr.addEventListener('abort', () => {
            reject(new Error('Загрузка файла была прервана'))
          })

          xhr.open('POST', '/api/materials/upload')
          xhr.send(formData)
        })

        const uploaded = await uploadPromise
        successfullyUploaded.push(uploaded)
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileName]
          return newProgress
        })
      } catch (err: any) {
        let errorMsg = err.message || 'Ошибка при загрузке файла'
        console.error(`Error uploading ${fileName}:`, err)
        
        // Улучшаем сообщения об ошибках для пользователя
        if (errorMsg.includes('Неподдерживаемый тип файла') || errorMsg.includes('Неподдерживаемый формат')) {
          // Оставляем оригинальное сообщение, так как оно уже содержит детали
          errorMsg = errorMsg
        } else if (errorMsg.includes('слишком большой')) {
          errorMsg = `Файл слишком большой. Максимальный размер: 100MB`
        } else if (errorMsg.includes('сети') || errorMsg.includes('network')) {
          errorMsg = `Проблема с интернет-соединением. Проверьте подключение и попробуйте снова.`
        } else if (errorMsg.includes('Ошибка при загрузке файла')) {
          // Если это общая ошибка, добавляем имя файла
          errorMsg = `Ошибка при загрузке файла ${fileName}. Проверьте формат и размер файла.`
        }
        
        errors.push(`${fileName}: ${errorMsg}`)
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[fileName]
          return newProgress
        })
      }
    }

    // Обновляем список загруженных файлов
    if (successfullyUploaded.length > 0) {
      setUploadedFiles(prev => [...prev, ...successfullyUploaded])
    }

    // Показываем ошибки, если есть
    if (errors.length > 0) {
      const errorMessage = errors.length === fileArray.length
        ? `Не удалось загрузить файлы: ${errors.join('; ')}`
        : `Загружено ${successfullyUploaded.length} из ${fileArray.length}. Ошибки: ${errors.join('; ')}`
      setError(errorMessage)
    } else if (successfullyUploaded.length > 0) {
      // Показываем успешное сообщение
      setError('')
    }

    setUploadingFiles([])
    setUploading(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      // Обновляем localStorage
      if (newFiles.length > 0) {
        localStorage.setItem('material_uploaded_files', JSON.stringify(newFiles))
      } else {
        localStorage.removeItem('material_uploaded_files')
      }
      return newFiles
    })
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
    localStorage.removeItem('material_uploaded_files')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!selectedSection) {
      setError('Выберите раздел')
      setLoading(false)
      return
    }

    try {
      // Для материалов с файлами используем первый файл как основной
      const payload: any = {
        sectionId: selectedSection,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        order: formData.order,
      }

      // Если есть загруженные файлы
      if (uploadedFiles.length > 0) {
        const firstFile = uploadedFiles[0]
        if (formData.type === 'video') {
          payload.videoUrl = firstFile.url
        } else if (formData.type === 'audio') {
          payload.audioUrl = firstFile.url
        } else if (formData.type === 'image') {
          payload.imageUrl = firstFile.url
        } else {
          payload.fileUrl = firstFile.url
          payload.fileName = firstFile.fileName
          payload.fileSize = firstFile.fileSize
        }

        // Сохраняем все файлы в content как JSON для удобного доступа
        // Это позволяет отображать все файлы, включая первый
        if (uploadedFiles.length > 0) {
          const allFiles = uploadedFiles.map(f => ({
            url: f.url,
            fileName: f.fileName,
            fileSize: f.fileSize,
            type: f.fileType,
          }))
          
          // Если файлов несколько, сохраняем все в additionalFiles
          // Первый файл также сохраняется в основных полях для обратной совместимости
          if (uploadedFiles.length > 1) {
            payload.content = JSON.stringify({
              text: formData.content,
              additionalFiles: allFiles.slice(1), // Все кроме первого
              allFiles: allFiles, // Все файлы для удобства
            })
          } else if (formData.content) {
            // Если только один файл, но есть текст, сохраняем его
            payload.content = formData.content
          }
        }
      } else if (formData.content) {
        // Если нет файлов, но есть контент
        payload.content = formData.content
      }

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при создании материала')
      }

      // Очищаем localStorage после успешного создания
      localStorage.removeItem('material_uploaded_files')
      router.push('/admin/content')
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании материала')
    } finally {
      setLoading(false)
    }
  }

  const availableSections = selectedStation
    ? stations.find(s => s.id === selectedStation)?.sections || []
    : []

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/admin/content"
              className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </Link>
            <h1 className="text-3xl font-bold">Создать материал</h1>
            <div></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Станция и Раздел */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Станция *
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => {
                    setSelectedStation(e.target.value)
                    setSelectedSection('')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Выберите станцию</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Раздел *
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                  disabled={!selectedStation}
                >
                  <option value="">Выберите раздел</option>
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Название */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название материала *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
                placeholder="Введите название материала"
              />
            </div>

            {/* Тип материала */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Тип материала *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'text', label: 'Текст', icon: FileText, color: 'gray' },
                  { value: 'video', label: 'Видео', icon: Video, color: 'red' },
                  { value: 'audio', label: 'Аудио', icon: Music, color: 'purple' },
                  { value: 'image', label: 'Изображение', icon: Image, color: 'blue' },
                  { value: 'pdf', label: 'PDF', icon: File, color: 'orange' },
                  { value: 'file', label: 'Файл', icon: File, color: 'green' },
                ].map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, type: value as any })
                      setUploadedFiles([])
                    }}
                    className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all ${
                      formData.type === value
                        ? `border-${color}-600 bg-${color}-50 shadow-md`
                        : 'border-gray-300 hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${formData.type === value ? `text-${color}-600` : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Множественная загрузка файлов через UploadThing */}
            {formData.type !== 'text' && (
              <div>
                <FileUploader
                  fileType={formData.type === 'pdf' ? 'file' : formData.type}
                  onUploadComplete={(files) => {
                    setUploadedFiles(files)
                    // Сохраняем в localStorage
                    if (files.length > 0) {
                      localStorage.setItem('material_uploaded_files', JSON.stringify(files))
                    } else {
                      localStorage.removeItem('material_uploaded_files')
                    }
                  }}
                  existingFiles={uploadedFiles}
                  onRemoveFile={(index) => {
                    removeFile(index)
                  }}
                />
              </div>
            )}

            {/* Контент */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.type === 'text' ? 'Содержимое *' : 'Описание'}
              </label>
              {formData.type === 'text' ? (
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Введите текст материала..."
                  required={formData.type === 'text'}
                />
              ) : (
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Дополнительное описание (необязательно)"
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                Используйте панель инструментов для форматирования текста: изменение размера, цвета, жирный, курсив и т.д.
              </p>
            </div>

            {/* Порядок */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Порядок отображения
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="0"
              />
            </div>

            {/* Кнопки */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Link
                href="/admin/content"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={loading || uploading || (formData.type !== 'text' && uploadedFiles.length === 0)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
              >
                {loading ? 'Создание...' : 'Создать материал'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewMaterialPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <NewMaterialPageContent />
    </Suspense>
  )
}
