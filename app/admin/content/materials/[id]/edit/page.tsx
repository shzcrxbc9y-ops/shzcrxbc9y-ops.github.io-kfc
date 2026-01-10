'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function EditMaterialPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text' as 'text' | 'video' | 'audio' | 'image' | 'pdf' | 'file',
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchMaterial(), fetchStations()])
  }, [params.id])

  const fetchMaterial = async () => {
    try {
      const res = await fetch(`/api/materials/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.material) {
          const material = data.material
          setFormData({
            title: material.title,
            content: material.content || '',
            type: material.type,
          })
          setSelectedSection(material.sectionId)
          setSelectedStation(material.section?.stationId || '')

          // Загружаем существующие файлы
          const files: UploadedFile[] = []
          if (material.videoUrl) {
            files.push({
              url: material.videoUrl,
              fileName: material.fileName || 'video',
              fileSize: material.fileSize || 0,
              fileType: 'video/mp4',
            })
          } else if (material.audioUrl) {
            files.push({
              url: material.audioUrl,
              fileName: material.fileName || 'audio',
              fileSize: material.fileSize || 0,
              fileType: 'audio/mpeg',
            })
          } else if (material.imageUrl) {
            files.push({
              url: material.imageUrl,
              fileName: material.fileName || 'image',
              fileSize: material.fileSize || 0,
              fileType: 'image/jpeg',
            })
          } else if (material.fileUrl) {
            files.push({
              url: material.fileUrl,
              fileName: material.fileName || 'file',
              fileSize: material.fileSize || 0,
              fileType: 'application/pdf',
            })
          }

          // Парсим дополнительные файлы из content, если есть
          try {
            const contentData = JSON.parse(material.content || '{}')
            if (contentData.additionalFiles) {
              files.push(...contentData.additionalFiles)
            }
          } catch {}

          setUploadedFiles(files)
        }
      }
    } catch (err) {
      setError('Ошибка загрузки материала')
    } finally {
      setLoading(false)
    }
  }

  const fetchStations = async () => {
    try {
      const res = await fetch('/api/admin/stations')
      if (res.ok) {
        const data = await res.json()
        setStations(data.stations)
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

    // Загружаем файлы по одному для лучшей обработки ошибок
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      const fileName = file.name

      try {
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileType', fileType)

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

    if (successfullyUploaded.length > 0) {
      setUploadedFiles(prev => [...prev, ...successfullyUploaded])
    }

    if (errors.length > 0) {
      const errorMessage = errors.length === fileArray.length
        ? `Не удалось загрузить файлы: ${errors.join('; ')}`
        : `Загружено ${successfullyUploaded.length} из ${fileArray.length}. Ошибки: ${errors.join('; ')}`
      setError(errorMessage)
    } else if (successfullyUploaded.length > 0) {
      setError('')
    }

    setUploadingFiles([])
    setUploading(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const payload: any = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        order: 0,
        sectionId: selectedSection,
      }

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

        if (uploadedFiles.length > 1) {
          const additionalFiles = uploadedFiles.slice(1)
          payload.content = JSON.stringify({
            text: formData.content,
            additionalFiles: additionalFiles.map(f => ({
              url: f.url,
              fileName: f.fileName,
              fileSize: f.fileSize,
              type: f.fileType,
            })),
          })
        }
      }

      const res = await fetch(`/api/materials/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при обновлении материала')
      }

      router.push('/admin/content')
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении материала')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
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
            <h1 className="text-3xl font-bold">Редактировать материал</h1>
            <div></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

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
              />
            </div>

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
                      localStorage.setItem(`material_uploaded_files_${params.id}`, JSON.stringify(files))
                    } else {
                      localStorage.removeItem(`material_uploaded_files_${params.id}`)
                    }
                  }}
                  existingFiles={uploadedFiles}
                  onRemoveFile={(index) => {
                    removeFile(index)
                  }}
                />
              </div>
            )}

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

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Link
                href="/admin/content"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </Link>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg"
              >
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
