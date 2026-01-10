'use client'

import { useState, useEffect } from 'react'
import { UploadButton } from '@/lib/uploadthing'
import { X, FileText, Video, Image, Music, File, Upload, CloudUpload } from 'lucide-react'

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

  const getFileTypeInfo = () => {
    switch (fileType) {
      case 'image':
        return {
          title: 'Загрузить изображения',
          description: 'Выберите одно или несколько изображений',
          icon: Image,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          maxSize: '4MB'
        }
      case 'video':
        return {
          title: 'Загрузить видео',
          description: 'Выберите одно или несколько видео файлов',
          icon: Video,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          maxSize: '64MB'
        }
      case 'audio':
        return {
          title: 'Загрузить аудио',
          description: 'Выберите один или несколько аудио файлов',
          icon: Music,
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          maxSize: '32MB'
        }
      case 'file':
        return {
          title: 'Загрузить файлы',
          description: 'Выберите один или несколько файлов',
          icon: File,
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          maxSize: '16MB'
        }
      default:
        return {
          title: 'Загрузить файлы',
          description: 'Выберите файлы для загрузки',
          icon: FileText,
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          maxSize: '16MB'
        }
    }
  }

  const fileInfo = getFileTypeInfo()
  const IconComponent = fileInfo.icon

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${fileInfo.iconBg} ${fileInfo.iconColor}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{fileInfo.title}</h3>
          <p className="text-xs text-gray-500">Максимальный размер: {fileInfo.maxSize}</p>
        </div>
      </div>

      <div className="relative group">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:via-white hover:to-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-lg">
          <div className="flex flex-col items-center justify-center text-center space-y-5">
            <div className="relative">
              <div className="p-5 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:scale-105">
                <CloudUpload className="w-10 h-10 text-blue-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="space-y-3 w-full max-w-md">
              <div className="flex justify-center">
                <div className="relative">
                  <UploadButton
                    endpoint={getUploadEndpoint()}
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                    className="ut-button:bg-gradient-to-r ut-button:from-blue-600 ut-button:to-blue-700 ut-button:hover:from-blue-700 ut-button:hover:to-blue-800 ut-button:active:scale-95 ut-button:rounded-xl ut-button:px-10 ut-button:py-4 ut-button:text-white ut-button:font-bold ut-button:text-base ut-button:shadow-xl ut-button:hover:shadow-2xl ut-button:transition-all ut-button:duration-200 ut-button:border-0 ut-button:outline-none ut-button:focus:ring-4 ut-button:focus:ring-blue-300 ut-allowed-content:hidden ut-readying:opacity-70 ut-readying:cursor-wait"
                  />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <p className="text-base text-gray-700 font-semibold">
                  {fileInfo.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Upload className="w-3 h-3" />
                  <span>Перетащите файлы сюда или нажмите кнопку выше</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
