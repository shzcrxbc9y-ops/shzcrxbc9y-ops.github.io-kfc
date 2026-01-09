'use client'

import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'

interface SectionItemProps {
  section: {
    id: string
    title: string
    description?: string | null
    order?: number
    _count?: { materials: number }
  }
}

export function SectionItem({ section }: SectionItemProps) {
  const handleDelete = async () => {
    if (
      !confirm(
        `Вы уверены, что хотите удалить раздел "${section.title}"?\n\nЭто действие удалит все материалы в этом разделе!`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/sections/${section.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.message || 'Ошибка при удалении раздела')
      }
    } catch (error) {
      alert('Ошибка при удалении раздела')
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <div className="font-medium">{section.title}</div>
        {section.description && (
          <div className="text-sm text-gray-600 mt-1">{section.description}</div>
        )}
        <div className="text-xs text-gray-500 mt-1">
          Материалов: {section._count?.materials || 0} | Порядок: {section.order || 0}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Link
          href={`/admin/sections/${section.id}/edit`}
          className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Редактировать"
        >
          <Edit className="w-4 h-4" />
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
  )
}

