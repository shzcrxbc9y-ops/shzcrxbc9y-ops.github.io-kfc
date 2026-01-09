'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface TestDeleteButtonProps {
  testId: string
  testTitle: string
}

export default function TestDeleteButton({ testId, testTitle }: TestDeleteButtonProps) {
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
      const res = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Ошибка при удалении теста')
      }

      router.refresh()
    } catch (error: any) {
      alert(error.message || 'Ошибка при удалении теста')
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">Удалить?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
        >
          {loading ? 'Удаление...' : 'Да'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
        >
          Нет
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center space-x-1"
      title={`Удалить тест: ${testTitle}`}
    >
      <Trash2 className="w-4 h-4" />
      <span>Удалить</span>
    </button>
  )
}
