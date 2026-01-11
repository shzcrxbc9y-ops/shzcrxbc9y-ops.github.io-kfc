'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BookOpen, Play, Image as ImageIcon, Music, File, FileText, FolderTree, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

interface Material {
  id: string
  title: string
  type: string
}

interface Section {
  id: string
  title: string
  description: string | null
  materials: Material[]
  _count: {
    materials: number
  }
}

interface StationCardProps {
  station: {
    id: string
    name: string
    description: string | null
    sections: Section[]
  }
  stationMaterialsCount: number
}

export function StationCard({ station, stationMaterialsCount }: StationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

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
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
      case 'audio':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
      case 'image':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
      case 'pdf':
        return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100'
      case 'file':
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
      default:
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Заголовок станции с кнопкой */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 sm:p-6 hover:from-blue-100 hover:to-indigo-100 transition-colors text-left"
      >
        <div className="flex items-start space-x-3 sm:space-x-4">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <FolderTree className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">{station.name}</h2>
                {station.description && (
                  <p className="text-sm sm:text-base text-gray-700 mb-3">{station.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
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
              <div className="flex-shrink-0 ml-4">
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6 text-gray-600" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Разделы (показываются при раскрытии) */}
      {isExpanded && (
        <div className="p-4 sm:p-6">
          {station.sections.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              Разделы пока не добавлены
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {station.sections.map((section) => (
                <SectionCard key={section.id} section={section} getMaterialIcon={getMaterialIcon} getMaterialColor={getMaterialColor} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SectionCard({ section, getMaterialIcon, getMaterialColor }: { section: Section, getMaterialIcon: (type: string) => JSX.Element, getMaterialColor: (type: string) => string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
      {/* Заголовок раздела с кнопкой */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{section.title}</h3>
          {section.description && (
            <p className="text-xs sm:text-sm text-gray-600 mb-3">{section.description}</p>
          )}
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{section._count.materials} {section._count.materials === 1 ? 'материал' : 'материалов'}</span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </button>

      {/* Материалы (показываются при раскрытии) */}
      {isExpanded && (
        <div className="p-4 sm:p-5 pt-0">
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
                      <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-gray-700">
                        {material.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded capitalize">
                          {material.type === 'video' ? 'Видео' : 
                           material.type === 'audio' ? 'Аудио' : 
                           material.type === 'image' ? 'Изображение' : 
                           material.type === 'pdf' ? 'PDF' : 
                           material.type === 'file' ? 'Файл' : 'Текст'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              Материалы в этом разделе пока не добавлены
            </div>
          )}
        </div>
      )}
    </div>
  )
}
