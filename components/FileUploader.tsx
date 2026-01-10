'use client'

import { useState, useEffect } from 'react'
import { UploadButton } from '@/lib/uploadthing'
import { X, FileText, Video, Image, Music, File } from 'lucide-react'

export interface UploadedFile {
  url: string
  fileName: string
  fileSize: number
  fileType: string
}

interface FileUploaderProps {
  fileType: 'image' | 'video' | 'audio' | 'file'
  onUploadComplete: (files: UploadedFile[]) => void
  existingFiles?: UploadedFile[]
  onRemoveFile?: (index: number) => void
}

export default function FileUploader({ 
  fileType, 
  onUploadComplete, 
  existingFiles = [],
  onRemoveFile 
}: FileUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(existingFiles)

  // Синхронизируем existingFiles с uploadedFiles
  useEffect(() => {
    setUploadedFiles(existingFiles)
  }, [existingFiles])

  const handleUploadComplete = (res: any) => {
    const newFiles: UploadedFile[] = res.map((file: any) => ({
      url: file.url,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || fileType,
    }))
    
    const updatedFiles = [...uploadedFiles, ...newFiles]
    setUploadedFiles(updatedFiles)
    onUploadComplete(updatedFiles)
  }

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error)
    alert(`Ошибка загрузки: ${error.message}`)
  }

  const getUploadEndpoint = () => {
    switch (fileType) {
      case 'image':
        return 'imageUploader'
      case 'video':
        return 'videoUploader'
      case 'audio':
        return 'audioUploader'
      case 'file':
        return 'fileUploader'
      default:
        return 'generalUploader'
    }
  }

  const getIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="w-5 h-5" />
      case 'video':
        return <Video className="w-5 h-5" />
      case 'audio':
        return <Music className="w-5 h-5" />
      case 'file':
        return <File className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        {getIcon()}
        <span className="font-semibold text-gray-800">
          {fileType === 'image' && 'Загрузить изображения'}
          {fileType === 'video' && 'Загрузить видео'}
          {fileType === 'audio' && 'Загрузить аудио'}
          {fileType === 'file' && 'Загрузить файлы'}
        </span>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:border-blue-400 transition-colors">
        <UploadButton
          endpoint={getUploadEndpoint()}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          className="ut-button:bg-blue-600 ut-button:hover:bg-blue-700 ut-button:rounded-lg ut-button:px-6 ut-button:py-3 ut-button:text-white ut-button:font-medium ut-allowed-content:text-gray-500"
        />
        <p className="text-sm text-gray-500 mt-3 text-center">
          {fileType === 'image' && 'Выберите одно или несколько изображений'}
          {fileType === 'video' && 'Выберите одно или несколько видео файлов'}
          {fileType === 'audio' && 'Выберите один или несколько аудио файлов'}
          {fileType === 'file' && 'Выберите один или несколько файлов'}
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Загружено файлов: <span className="text-blue-600">{uploadedFiles.length}</span>
            </p>
            {onRemoveFile && (
              <button
                onClick={() => {
                  setUploadedFiles([])
                  onUploadComplete([])
                }}
                className="text-xs text-red-600 hover:text-red-700 hover:underline"
              >
                Очистить все
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-blue-600">
                    {getIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.fileSize)}
                    </p>
                  </div>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={() => {
                      const newFiles = uploadedFiles.filter((_, i) => i !== index)
                      setUploadedFiles(newFiles)
                      onUploadComplete(newFiles)
                      onRemoveFile(index)
                    }}
                    className="ml-3 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Удалить файл"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
