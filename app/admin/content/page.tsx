'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Building2, 
  FolderTree, 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  File
} from 'lucide-react'

interface Station {
  id: string
  name: string
  description: string | null
  order: number
  sections: Section[]
}

interface Section {
  id: string
  title: string
  description: string | null
  order: number
  stationId: string
  materials: Material[]
}

interface Material {
  id: string
  title: string
  type: string
  order: number
  sectionId: string
}

export default function ContentManagementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState<Station[]>([])
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [stationsRes, sectionsRes, materialsRes] = await Promise.all([
        fetch('/api/stations'),
        fetch('/api/sections'),
        fetch('/api/materials'),
      ])

      if (stationsRes.ok) {
        const stationsData = await stationsRes.json()
        const stationsList = stationsData.stations || []

        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json()
          const sectionsList = sectionsData.sections || []

          if (materialsRes.ok) {
            const materialsData = await materialsRes.json()
            const materialsList = materialsData.materials || []

            // Группируем разделы по станциям
            const stationsWithSections = stationsList.map((station: Station) => ({
              ...station,
              sections: sectionsList
                .filter((s: Section) => s.stationId === station.id)
                .map((section: Section) => ({
                  ...section,
                  materials: materialsList.filter((m: Material) => m.sectionId === section.id),
                })),
            }))

            setStations(stationsWithSections)
          }
        }
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const toggleStation = (stationId: string) => {
    const newExpanded = new Set(expandedStations)
    if (newExpanded.has(stationId)) {
      newExpanded.delete(stationId)
    } else {
      newExpanded.add(stationId)
    }
    setExpandedStations(newExpanded)
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const handleDeleteStation = async (stationId: string, stationName: string) => {
    if (!confirm(`Удалить станцию "${stationName}"? Все разделы и материалы будут также удалены.`)) {
      return
    }

    try {
      const res = await fetch(`/api/stations/${stationId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Ошибка при удалении станции')
      }

      loadData()
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении станции')
    }
  }

  const handleDeleteSection = async (sectionId: string, sectionTitle: string) => {
    if (!confirm(`Удалить раздел "${sectionTitle}"? Все материалы будут также удалены.`)) {
      return
    }

    try {
      const res = await fetch(`/api/sections/${sectionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Ошибка при удалении раздела')
      }

      loadData()
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении раздела')
    }
  }

  const handleDeleteMaterial = async (materialId: string, materialTitle: string) => {
    if (!confirm(`Удалить материал "${materialTitle}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error('Ошибка при удалении материала')
      }

      loadData()
    } catch (err: any) {
      alert(err.message || 'Ошибка при удалении материала')
    }
  }

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-red-500" />
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />
      case 'audio':
        return <Music className="w-4 h-4 text-purple-500" />
      case 'pdf':
      case 'file':
        return <File className="w-4 h-4 text-orange-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Заголовок */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 text-sm mb-2 inline-block transition-colors font-medium"
              >
                ← Назад в админ-панель
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">Управление контентом</h1>
              <p className="text-gray-600 mt-1 text-sm">Управление станциями, разделами и материалами</p>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              <Link
                href="/admin/content/stations/new"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Станция</span>
              </Link>
              <Link
                href="/admin/content/sections/new"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Раздел</span>
              </Link>
              <Link
                href="/admin/content/materials/new"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center space-x-2 text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Материал</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Дерево контента */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Структура контента</h2>
          </div>
          <div className="p-6">
            {stations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Нет станций. Создайте первую станцию!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stations.map((station) => (
                  <div key={station.id} className="border border-gray-200 rounded-lg">
                    {/* Станция */}
                    <div
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-200"
                      onClick={() => toggleStation(station.id)}
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        {expandedStations.has(station.id) ? (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{station.name}</h3>
                          {station.description && (
                            <p className="text-sm text-gray-600">{station.description}</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {station.sections.length} разделов
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Link
                          href={`/admin/content/stations/${station.id}/edit`}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteStation(station.id, station.name)
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Разделы станции */}
                    {expandedStations.has(station.id) && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {station.sections.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Нет разделов
                          </div>
                        ) : (
                          station.sections.map((section) => (
                            <div key={section.id} className="border-b border-gray-200 last:border-b-0">
                              <div
                                className="flex items-center justify-between p-4 hover:bg-white transition-colors cursor-pointer"
                                onClick={() => toggleSection(section.id)}
                              >
                                <div className="flex items-center space-x-3 flex-1">
                                  {expandedSections.has(section.id) ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500 ml-6" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500 ml-6" />
                                  )}
                                  <FolderTree className="w-4 h-4 text-green-600" />
                                  <div>
                                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                                    {section.description && (
                                      <p className="text-xs text-gray-600">{section.description}</p>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {section.materials.length} материалов
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Link
                                    href={`/admin/content/sections/${section.id}/edit`}
                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Редактировать раздел"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteSection(section.id, section.title)
                                    }}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Удалить раздел"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Материалы раздела */}
                              {expandedSections.has(section.id) && (
                                <div className="bg-white border-t border-gray-200">
                                  {section.materials.length === 0 ? (
                                    <div className="p-3 pl-16 text-center text-gray-500 text-sm">
                                      Нет материалов
                                    </div>
                                  ) : (
                                    section.materials.map((material) => (
                                      <div
                                        key={material.id}
                                        className="flex items-center justify-between p-3 pl-16 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                      >
                                        <div className="flex items-center space-x-3 flex-1">
                                          {getMaterialIcon(material.type)}
                                          <div>
                                            <h5 className="text-sm font-medium text-gray-900">
                                              {material.title}
                                            </h5>
                                            <p className="text-xs text-gray-500">
                                              Тип: {material.type}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Link
                                            href={`/admin/content/materials/${material.id}/edit`}
                                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            title="Редактировать материал"
                                          >
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </Link>
                                          <button
                                            onClick={() => handleDeleteMaterial(material.id, material.title)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Удалить материал"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                  <div className="p-3 pl-16 border-t border-gray-200 bg-gray-50">
                                    <Link
                                      href={`/admin/content/materials/new?sectionId=${section.id}`}
                                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 font-medium transition-colors"
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span>Добавить материал</span>
                                    </Link>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                          <Link
                            href={`/admin/content/sections/new?stationId=${station.id}`}
                            className="text-sm text-green-600 hover:text-green-700 flex items-center space-x-1 font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Добавить раздел в эту станцию</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
