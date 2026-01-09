'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Type,
  Palette
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Введите текст...',
  required = false 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)

  const colors = [
    { name: 'Черный', value: '#000000' },
    { name: 'Красный', value: '#dc2626' },
    { name: 'Синий', value: '#2563eb' },
    { name: 'Зеленый', value: '#16a34a' },
    { name: 'Оранжевый', value: '#ea580c' },
    { name: 'Фиолетовый', value: '#9333ea' },
    { name: 'Серый', value: '#6b7280' },
  ]

  const sizes = [
    { name: 'Очень маленький', value: '12px' },
    { name: 'Маленький', value: '14px' },
    { name: 'Обычный', value: '16px' },
    { name: 'Большой', value: '18px' },
    { name: 'Очень большой', value: '20px' },
    { name: 'Заголовок 1', value: '32px' },
    { name: 'Заголовок 2', value: '24px' },
    { name: 'Заголовок 3', value: '20px' },
  ]

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  // Закрываем панели при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.rich-text-editor-container')) {
        setShowColorPicker(false)
        setShowSizePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleColorChange = (color: string) => {
    execCommand('foreColor', color)
    setShowColorPicker(false)
  }

  const handleSizeChange = (size: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) {
        // Если есть выделение, применяем размер к выделенному тексту
        const span = document.createElement('span')
        span.style.fontSize = size
        try {
          range.surroundContents(span)
        } catch (e) {
          // Если не удалось обернуть, используем другой метод
          const contents = range.extractContents()
          span.appendChild(contents)
          range.insertNode(span)
        }
        updateContent()
      } else {
        // Если нет выделения, создаем span для следующего текста
        const span = document.createElement('span')
        span.style.fontSize = size
        span.textContent = '\u200B' // Невидимый символ
        range.insertNode(span)
        // Перемещаем курсор после span
        range.setStartAfter(span)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
        updateContent()
      }
    }
    setShowSizePicker(false)
  }

  return (
    <div className="rich-text-editor-container border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      {/* Панель инструментов */}
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap items-center gap-1">
        {/* Форматирование текста */}
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Жирный (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Курсив (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Подчеркивание (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Размер текста */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSizePicker(!showSizePicker)
              setShowColorPicker(false)
            }}
            className="p-2 hover:bg-gray-200 rounded transition-colors flex items-center space-x-1"
            title="Размер текста"
          >
            <Type className="w-4 h-4" />
            <span className="text-xs">Размер</span>
          </button>
          {showSizePicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
              {sizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => handleSizeChange(size.value)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-sm"
                  style={{ fontSize: size.value }}
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Цвет текста */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker)
              setShowSizePicker(false)
            }}
            className="p-2 hover:bg-gray-200 rounded transition-colors flex items-center space-x-1"
            title="Цвет текста"
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs">Цвет</span>
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorChange(color.value)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Выравнивание */}
        <button
          type="button"
          onClick={() => execCommand('justifyLeft')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Выровнять по левому краю"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyCenter')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Выровнять по центру"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('justifyRight')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Выровнять по правому краю"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        {/* Списки */}
        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Маркированный список"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Нумерованный список"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>

      {/* Редактор */}
      <div
        ref={editorRef}
        contentEditable
        onInput={updateContent}
        onBlur={updateContent}
        className="min-h-[200px] max-h-[500px] overflow-y-auto p-4 focus:outline-none prose prose-sm max-w-none"
        style={{
          fontSize: '16px',
          lineHeight: '1.6',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Стили для placeholder */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
