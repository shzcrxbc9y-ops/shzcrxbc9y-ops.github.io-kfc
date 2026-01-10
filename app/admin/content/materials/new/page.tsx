'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
    order: 0,
  })
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadedPdfFiles, setUploadedPdfFiles] = useState<UploadedFile[]>([])
  const [uploadedWordFiles, setUploadedWordFiles] = useState<UploadedFile[]>([])
  const [uploadedOtherFiles, setUploadedOtherFiles] = useState<UploadedFile[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStations()
    const sectionId = searchParams?.get('sectionId')
    if (sectionId) {
      setSelectedSection(sectionId)
    }
    
    // Восстанавливаем загруженные файлы из localStorage
    const savedPdfFiles = localStorage.getItem('material_pdf_files')
    const savedWordFiles = localStorage.getItem('material_word_files')
    const savedOtherFiles = localStorage.getItem('material_other_files')
    
    if (savedPdfFiles) {
      try {
        const files = JSON.parse(savedPdfFiles)
        if (Array.isArray(files) && files.length > 0) {
          setUploadedPdfFiles(files)
        }
      } catch (e) {
        console.error('Error restoring PDF files:', e)
      }
    }
    
    if (savedWordFiles) {
      try {
        const files = JSON.parse(savedWordFiles)
        if (Array.isArray(files) && files.length > 0) {
          setUploadedWordFiles(files)
        }
      } catch (e) {
        console.error('Error restoring Word files:', e)
      }
    }
    
    if (savedOtherFiles) {
      try {
        const files = JSON.parse(savedOtherFiles)
        if (Array.isArray(files) && files.length > 0) {
          setUploadedOtherFiles(files)
        }
      } catch (e) {
        console.error('Error restoring other files:', e)
      }
    }
  }, [searchParams])

  // Сохраняем загруженные файлы в localStorage
  useEffect(() => {
    if (uploadedPdfFiles.length > 0) {
      localStorage.setItem('material_pdf_files', JSON.stringify(uploadedPdfFiles))
    } else {
      localStorage.removeItem('material_pdf_files')
    }
  }, [uploadedPdfFiles])

  useEffect(() => {
    if (uploadedWordFiles.length > 0) {
      localStorage.setItem('material_word_files', JSON.stringify(uploadedWordFiles))
    } else {
      localStorage.removeItem('material_word_files')
    }
  }, [uploadedWordFiles])

  useEffect(() => {
    if (uploadedOtherFiles.length > 0) {
      localStorage.setItem('material_other_files', JSON.stringify(uploadedOtherFiles))
    } else {
      localStorage.removeItem('material_other_files')
    }
  }, [uploadedOtherFiles])

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


  const removePdfFile = (index: number) => {
    setUploadedPdfFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      if (newFiles.length > 0) {
        localStorage.setItem('material_pdf_files', JSON.stringify(newFiles))
      } else {
        localStorage.removeItem('material_pdf_files')
      }
      return newFiles
    })
  }

  const removeWordFile = (index: number) => {
    setUploadedWordFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      if (newFiles.length > 0) {
        localStorage.setItem('material_word_files', JSON.stringify(newFiles))
      } else {
        localStorage.removeItem('material_word_files')
      }
      return newFiles
    })
  }

  const removeOtherFile = (index: number) => {
    setUploadedOtherFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index)
      if (newFiles.length > 0) {
        localStorage.setItem('material_other_files', JSON.stringify(newFiles))
      } else {
        localStorage.removeItem('material_other_files')
      }
      return newFiles
    })
  }

  const clearAllFiles = () => {
    setUploadedPdfFiles([])
    setUploadedWordFiles([])
    setUploadedOtherFiles([])
    localStorage.removeItem('material_pdf_files')
    localStorage.removeItem('material_word_files')
    localStorage.removeItem('material_other_files')
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
      // Собираем все файлы
      const allFiles: UploadedFile[] = [
        ...uploadedPdfFiles,
        ...uploadedWordFiles,
      ...uploadedOtherFiles,
      ]

      // Определяем тип материала на основе первого файла (для обратной совместимости)
      let materialType = 'text'
      let mainFileUrl = null
      let mainFileName = null
      let mainFileSize = null

      if (allFiles.length > 0) {
        const firstFile = allFiles[0]
        mainFileUrl = firstFile.url
        mainFileName = firstFile.fileName
        mainFileSize = firstFile.fileSize
        
        // Определяем тип по расширению файла
        const ext = firstFile.fileName.split('.').pop()?.toLowerCase()
        if (ext === 'pdf') {
          materialType = 'pdf'
        } else if (['doc', 'docx'].includes(ext || '')) {
          materialType = 'file'
        } else {
          materialType = 'file'
        }
      }

      // Формируем структурированный контент
      const contentData: any = {
        text: formData.content || '',
      }

      // Добавляем все файлы в структурированный формат
      if (allFiles.length > 0) {
        contentData.files = allFiles.map(f => ({
          url: f.url,
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileType: f.fileType,
        }))
      }

      const payload: any = {
        sectionId: selectedSection,
        title: formData.title,
        content: JSON.stringify(contentData),
        type: materialType,
        order: formData.order,
      }

      // Для обратной совместимости сохраняем первый файл в основные поля
      if (mainFileUrl) {
        payload.fileUrl = mainFileUrl
        payload.fileName = mainFileName
        payload.fileSize = mainFileSize
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
      localStorage.removeItem('material_pdf_files')
      localStorage.removeItem('material_word_files')
      localStorage.removeItem('material_other_files')
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

            {/* Текстовый контент */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текстовое содержимое
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => setFormData({ ...formData, content: value })}
                placeholder="Введите текст материала (необязательно)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Используйте панель инструментов для форматирования текста: изменение размера, цвета, жирный, курсив и т.д.
              </p>
            </div>

            {/* Загрузка PDF файлов */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF документы
              </label>
              <FileUploader
                fileType="pdf"
                onUploadComplete={(files) => {
                  setUploadedPdfFiles(files)
                  if (files.length > 0) {
                    localStorage.setItem('material_pdf_files', JSON.stringify(files))
                  } else {
                    localStorage.removeItem('material_pdf_files')
                  }
                }}
                existingFiles={uploadedPdfFiles}
                onRemoveFile={removePdfFile}
              />
            </div>

            {/* Загрузка Word файлов */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Word документы (DOC, DOCX)
              </label>
              <FileUploader
                fileType="file"
                onUploadComplete={(files) => {
                  // Фильтруем только Word файлы
                  const wordFiles = files.filter(f => {
                    const ext = f.fileName.split('.').pop()?.toLowerCase()
                    return ext === 'doc' || ext === 'docx'
                  })
                  setUploadedWordFiles(wordFiles)
                  if (wordFiles.length > 0) {
                    localStorage.setItem('material_word_files', JSON.stringify(wordFiles))
                  } else {
                    localStorage.removeItem('material_word_files')
                  }
                }}
                existingFiles={uploadedWordFiles}
                onRemoveFile={removeWordFile}
              />
            </div>

            {/* Загрузка других файлов */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Другие файлы
              </label>
              <FileUploader
                fileType="file"
                onUploadComplete={(files) => {
                  // Фильтруем файлы, которые не PDF и не Word
                  const otherFiles = files.filter(f => {
                    const ext = f.fileName.split('.').pop()?.toLowerCase()
                    return ext !== 'pdf' && ext !== 'doc' && ext !== 'docx'
                  })
                  setUploadedOtherFiles(otherFiles)
                  if (otherFiles.length > 0) {
                    localStorage.setItem('material_other_files', JSON.stringify(otherFiles))
                  } else {
                    localStorage.removeItem('material_other_files')
                  }
                }}
                existingFiles={uploadedOtherFiles}
                onRemoveFile={removeOtherFile}
              />
            </div>

            {/* Кнопка очистки всех файлов */}
            {(uploadedPdfFiles.length > 0 || uploadedWordFiles.length > 0 || uploadedOtherFiles.length > 0) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearAllFiles}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Очистить все файлы
                </button>
              </div>
            )}

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
                disabled={loading || (formData.content.trim() === '' && uploadedPdfFiles.length === 0 && uploadedWordFiles.length === 0 && uploadedOtherFiles.length === 0)}
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
