'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface UserDeleteButtonProps {
  userId: string
  userName: string
  userRole: string
}

export default function UserDeleteButton({ userId, userName, userRole }: UserDeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при удалении пользователя')
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении пользователя')
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  // Не показываем кнопку удаления для администраторов
  if (userRole === 'ADMIN') {
    return null
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600 font-medium">Удалить?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50 transition-colors"
        >
          {loading ? 'Удаление...' : 'Да'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm transition-colors"
        >
          Нет
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
      title={`Удалить пользователя: ${userName}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
