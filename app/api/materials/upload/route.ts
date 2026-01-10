import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
// Расширенный список типов для мобильных устройств
const ALLOWED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 
  'video/x-msvideo', 'video/3gpp', 'video/3gpp2', 'video/x-matroska'
]
const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 
  'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/webm'
]
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/heic', 'image/heif', 'image/x-icon', 'image/bmp'
]
const ALLOWED_DOC_TYPES = [
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию (только админ)
    await requireAuth('ADMIN')

    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('fileType') as string // video, audio, image, pdf, file

    if (!file) {
      return NextResponse.json(
        { message: 'Файл не предоставлен' },
        { status: 400 }
      )
    }

    // Проверяем размер файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'Файл слишком большой. Максимальный размер: 100MB' },
        { status: 400 }
      )
    }

    // Определяем тип файла и проверяем его
    let uploadDir = 'public'
    let fileExtension = ''
    let allowedTypes: string[] = []

    switch (fileType) {
      case 'video':
        uploadDir = 'public/videos'
        allowedTypes = ALLOWED_VIDEO_TYPES
        fileExtension = file.name.split('.').pop() || 'mp4'
        break
      case 'audio':
        uploadDir = 'public/audio'
        allowedTypes = ALLOWED_AUDIO_TYPES
        fileExtension = file.name.split('.').pop() || 'mp3'
        break
      case 'image':
        uploadDir = 'public/images'
        allowedTypes = ALLOWED_IMAGE_TYPES
        fileExtension = file.name.split('.').pop() || 'jpg'
        break
      case 'pdf':
      case 'file':
        uploadDir = 'public/files'
        allowedTypes = ALLOWED_DOC_TYPES
        fileExtension = file.name.split('.').pop() || 'pdf'
        break
      default:
        return NextResponse.json(
          { message: 'Неверный тип файла' },
          { status: 400 }
        )
    }

    // Проверяем MIME тип (более гибкая проверка для мобильных устройств)
    const fileTypeLower = file.type.toLowerCase()
    const fileNameLower = file.name.toLowerCase()
    
    // Проверяем по MIME типу
    const isAllowedMimeType = allowedTypes.some(type => fileTypeLower.includes(type.split('/')[1]))
    
    // Проверяем по расширению файла (для мобильных устройств, которые могут не передавать правильный MIME тип)
    let isAllowedExtension = false
    const extension = fileNameLower.split('.').pop() || ''
    
    if (fileType === 'video') {
      isAllowedExtension = ['mp4', 'webm', 'ogg', 'mov', 'avi', '3gp', '3g2', 'mkv'].includes(extension)
    } else if (fileType === 'audio') {
      isAllowedExtension = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'webm'].includes(extension)
    } else if (fileType === 'image') {
      isAllowedExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'ico', 'bmp'].includes(extension)
    } else if (fileType === 'pdf' || fileType === 'file') {
      isAllowedExtension = ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension)
    }
    
    if (!isAllowedMimeType && !isAllowedExtension) {
      return NextResponse.json(
        { 
          message: `Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}. Ваш файл: ${file.type || 'неизвестный тип'}`,
          receivedType: file.type,
          fileName: file.name
        },
        { status: 400 }
      )
    }

    // Создаем директорию, если её нет
    const uploadPath = join(process.cwd(), uploadDir)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}_${sanitizedName}`
    const filePath = join(uploadPath, fileName)

    // Сохраняем файл
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Возвращаем URL файла
    const fileUrl = `/${uploadDir.replace('public/', '')}/${fileName}`

    return NextResponse.json({
      message: 'Файл успешно загружен',
      url: fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Upload error:', error)
    return NextResponse.json(
      { message: 'Ошибка при загрузке файла' },
      { status: 500 }
    )
  }
}

