'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X, FileText, Video, Image, Music, File } from 'lucide-react'

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

export default function NewMaterialPage() {
  const router = useRouter()
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
  const [uploadedFile, setUploadedFile] = useState<{
    url: string
    fileName: string
    fileSize: number
  } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStations()
  }, [])

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

  const handleFileUpload = async (file: File, fileType: string) => {
    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)

      const res = await fetch('/api/materials/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка загрузки файла')
      }

      setUploadedFile({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.fileSize,
      })

      // Обновляем форму в зависимости от типа
      setFormData(prev => ({
        ...prev,
        type: fileType as any,
        ...(fileType === 'video' && { videoUrl: data.url }),
        ...(fileType === 'audio' && { audioUrl: data.url }),
        ...(fileType === 'image' && { imageUrl: data.url }),
        ...((fileType === 'pdf' || fileType === 'file') && { fileUrl: data.url, fileName: data.fileName }),
      }))
    } catch (err: any) {
      setError(err.message || 'Ошибка при загрузке файла')
    } finally {
      setUploading(false)
    }
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
      const payload = {
        sectionId: selectedSection,
        title: formData.title,
        content: formData.content,
        type: formData.type,
        order: formData.order,
        ...(formData.type === 'video' && { videoUrl: uploadedFile?.url }),
        ...(formData.type === 'audio' && { audioUrl: uploadedFile?.url }),
        ...(formData.type === 'image' && { imageUrl: uploadedFile?.url }),
        ...((formData.type === 'pdf' || formData.type === 'file') && {
          fileUrl: uploadedFile?.url,
          fileName: uploadedFile?.fileName,
          fileSize: uploadedFile?.fileSize,
        }),
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

      router.push('/admin/materials')
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании материала')
    } finally {
      setLoading(false)
    }
  }

  const availableSections = selectedStation
    ? stations.find(s => s.id === selectedStation)?.sections || []
    : []

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin/materials"
          className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </Link>
        <h1 className="text-3xl font-bold">Создать материал</h1>
        <div></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Выбор станции и раздела */}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          />
        </div>

        {/* Тип материала */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип материала *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'text', label: 'Текст', icon: FileText },
              { value: 'video', label: 'Видео', icon: Video },
              { value: 'audio', label: 'Аудио', icon: Music },
              { value: 'image', label: 'Изображение', icon: Image },
              { value: 'pdf', label: 'PDF', icon: File },
              { value: 'file', label: 'Файл', icon: File },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setFormData({ ...formData, type: value as any })
                  setUploadedFile(null)
                }}
                className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-colors ${
                  formData.type === value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Icon className="w-6 h-6 mb-2" />
                <span className="text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Загрузка файла (если не текст) */}
        {formData.type !== 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Загрузить файл {formData.type === 'video' && '(MP4, WebM)'}
              {formData.type === 'audio' && '(MP3, WAV)'}
              {formData.type === 'image' && '(JPG, PNG, GIF)'}
              {(formData.type === 'pdf' || formData.type === 'file') && '(PDF, DOC, DOCX)'}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {uploadedFile ? (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div>
                    <p className="font-medium">{uploadedFile.fileName}</p>
                    <p className="text-sm text-gray-500">
                      {(uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFile(null)
                      setFormData(prev => ({
                        ...prev,
                        videoUrl: undefined,
                        audioUrl: undefined,
                        imageUrl: undefined,
                        fileUrl: undefined,
                      }))
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept={
                      formData.type === 'video'
                        ? 'video/*'
                        : formData.type === 'audio'
                        ? 'audio/*'
                        : formData.type === 'image'
                        ? 'image/*'
                        : '.pdf,.doc,.docx'
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file, formData.type)
                      }
                    }}
                    disabled={uploading}
                  />
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {uploading ? 'Загрузка...' : 'Нажмите для загрузки файла'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Максимум 100MB</p>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Контент (для текста или дополнительное описание) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.type === 'text' ? 'Содержимое *' : 'Описание (HTML поддерживается)'}
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
            required={formData.type === 'text'}
            placeholder={formData.type === 'text' ? 'Введите текст материала...' : 'Дополнительное описание (необязательно)'}
          />
          <p className="text-xs text-gray-500 mt-1">
            Можно использовать HTML теги для форматирования
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            min="0"
          />
        </div>

        {/* Кнопки */}
        <div className="flex justify-end space-x-4 pt-4">
          <Link
            href="/admin/materials"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Отмена
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать материал'}
          </button>
        </div>
      </form>
    </div>
  )
}

