'use client'

import Link from 'next/link'
import { Edit, Trash2, FileText, Video, Music, Image, File } from 'lucide-react'

interface MaterialItemProps {
  material: {
    id: string
    title: string
    type: string
    order: number
  }
}

export function MaterialItem({ material }: MaterialItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      case 'image':
        return <Image className="w-4 h-4" />
      case 'pdf':
      case 'file':
        return <File className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Вы уверены, что хотите удалить материал "${material.title}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.message || 'Ошибка при удалении материала')
      }
    } catch (error) {
      alert('Ошибка при удалении материала')
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <div className="text-primary-600">{getTypeIcon(material.type)}</div>
        <div className="flex-1">
          <div className="font-medium">{material.title}</div>
          <div className="text-sm text-gray-500">
            Тип: {material.type} | Порядок: {material.order}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Link
          href={`/admin/content/materials/${material.id}/edit`}
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

