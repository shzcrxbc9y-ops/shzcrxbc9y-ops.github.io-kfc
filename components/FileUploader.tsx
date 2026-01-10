'use client'

import { useState } from 'react'
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="font-medium">
          {fileType === 'image' && 'Изображения'}
          {fileType === 'video' && 'Видео'}
          {fileType === 'audio' && 'Аудио'}
          {fileType === 'file' && 'Файлы'}
        </span>
      </div>

      <UploadButton
        endpoint={getUploadEndpoint()}
        onClientUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        className="ut-button:bg-blue-600 ut-button:hover:bg-blue-700"
      />

      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Загружено файлов: {uploadedFiles.length}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIcon()}
                  <span className="text-sm text-gray-700 truncate">
                    {file.fileName}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({(file.fileSize / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                {onRemoveFile && (
                  <button
                    onClick={() => {
                      const newFiles = uploadedFiles.filter((_, i) => i !== index)
                      setUploadedFiles(newFiles)
                      onUploadComplete(newFiles)
                      onRemoveFile(index)
                    }}
                    className="ml-2 p-1 text-red-600 hover:text-red-700"
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
