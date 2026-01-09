'use client'

import Link from 'next/link'
import { Edit, Trash2, FolderOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { SectionItem } from './SectionItem'

interface StationItemProps {
  station: {
    id: string
    name: string
    description: string | null
    order: number
    sections: Array<{
      id: string
      title: string
      description?: string | null
      order?: number
      _count?: { materials: number }
    }>
    _count: { sections: number }
  }
}

export function StationItem({ station }: StationItemProps) {
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить станцию "${station.name}"?\n\nЭто действие удалит все разделы и материалы в этой станции!`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/stations/${station.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.message || 'Ошибка при удалении станции')
      }
    } catch (error) {
      alert('Ошибка при удалении станции')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FolderOpen className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
            <div>
              <h2 className="text-xl font-semibold">{station.name}</h2>
              {station.description && (
                <p className="text-sm text-gray-600 mt-1">{station.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Разделов: {station._count.sections} | Порядок: {station.order}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/admin/content/stations/${station.id}/edit`}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
            title="Редактировать"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <Link
            href={`/admin/content/sections/new?stationId=${station.id}`}
            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Добавить раздел"
          >
            <Plus className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pl-8 border-l-2 border-gray-200">
          {station.sections.length === 0 ? (
            <p className="text-sm text-gray-500">Разделы не добавлены</p>
          ) : (
            <div className="space-y-2">
              {station.sections.map((section) => (
                <SectionItem key={section.id} section={section} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

