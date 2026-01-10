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
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {fileType === 'image' && 'Загрузить изображения'}
          {fileType === 'video' && 'Загрузить видео'}
          {fileType === 'audio' && 'Загрузить аудио'}
          {fileType === 'file' && 'Загрузить файлы'}
        </label>
        <UploadButton
          endpoint={getUploadEndpoint()}
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-gray-600 font-medium">
            Загружено: {uploadedFiles.length} {uploadedFiles.length === 1 ? 'файл' : 'файлов'}
          </div>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-gray-400 flex-shrink-0">
                    {getIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {file.fileName}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatFileSize(file.fileSize)}
                    </div>
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
                    className="ml-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
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
