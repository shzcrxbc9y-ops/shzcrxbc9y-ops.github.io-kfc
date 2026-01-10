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

    // Проверяем MIME тип и расширение файла (более гибкая проверка для мобильных устройств)
    const fileTypeLower = file.type ? file.type.toLowerCase() : ''
    const fileNameLower = file.name.toLowerCase()
    
    // Получаем расширение файла (регистронезависимо)
    const extension = fileNameLower.split('.').pop() || ''
    
    // Определяем разрешенные расширения для каждого типа
    const allowedExtensions: string[] = []
    
    if (fileType === 'video') {
      allowedExtensions.push('mp4', 'webm', 'ogg', 'mov', 'avi', '3gp', '3g2', 'mkv', 'm4v', 'flv', 'wmv', 'mpg', 'mpeg')
    } else if (fileType === 'audio') {
      allowedExtensions.push('mp3', 'wav', 'ogg', 'aac', 'm4a', 'webm', 'flac', 'wma', 'opus', 'amr')
    } else if (fileType === 'image') {
      allowedExtensions.push('jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'ico', 'bmp', 'svg', 'tiff', 'tif', 'jfif')
    } else if (fileType === 'pdf') {
      allowedExtensions.push('pdf')
    } else if (fileType === 'file') {
      // Для типа "file" принимаем все документы
      allowedExtensions.push('pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp', 'csv')
    }
    
    // Проверяем по расширению файла (основная проверка)
    let isAllowedExtension = allowedExtensions.includes(extension)
    
    // Проверяем по MIME типу (дополнительная проверка)
    let isAllowedMimeType = false
    if (fileTypeLower) {
      // Более гибкая проверка MIME типа
      if (fileType === 'image') {
        isAllowedMimeType = fileTypeLower.startsWith('image/')
      } else if (fileType === 'video') {
        isAllowedMimeType = fileTypeLower.startsWith('video/')
      } else if (fileType === 'audio') {
        isAllowedMimeType = fileTypeLower.startsWith('audio/')
      } else if (fileType === 'pdf') {
        isAllowedMimeType = fileTypeLower === 'application/pdf' || fileTypeLower.includes('pdf')
      } else if (fileType === 'file') {
        // Для типа "file" принимаем любые документы
        isAllowedMimeType = fileTypeLower.includes('pdf') || 
                           fileTypeLower.includes('word') || 
                           fileTypeLower.includes('excel') || 
                           fileTypeLower.includes('spreadsheet') ||
                           fileTypeLower.includes('powerpoint') ||
                           fileTypeLower.includes('presentation') ||
                           fileTypeLower.includes('text') ||
                           fileTypeLower.includes('document') ||
                           fileTypeLower.includes('msword') ||
                           fileTypeLower.includes('officedocument') ||
                           fileTypeLower.includes('csv') ||
                           fileTypeLower.includes('rtf')
      }
    }
    
    // Если расширение отсутствует или файл не имеет расширения, но пользователь выбрал тип
    // и MIME тип соответствует - принимаем файл
    const hasNoExtension = !extension || extension === fileNameLower || extension.length > 10
    
    // Принимаем файл если:
    // 1. Расширение соответствует выбранному типу
    // 2. MIME тип соответствует выбранному типу
    // 3. Расширение отсутствует, но MIME тип соответствует (доверяем выбору пользователя)
    if (!isAllowedExtension && !isAllowedMimeType) {
      // Если нет расширения, но пользователь выбрал тип - принимаем (доверяем выбору)
      if (hasNoExtension) {
        console.warn('File extension not found, but accepting based on user selection:', {
          fileName: file.name,
          selectedType: fileType,
          mimeType: file.type
        })
        // Принимаем файл, так как пользователь явно выбрал тип
      } else {
        // Расширение есть, но не соответствует выбранному типу
        console.error('File validation failed:', {
          fileName: file.name,
          fileType: file.type,
          extension: extension,
          requestedType: fileType,
          allowedExtensions: allowedExtensions
        })
        
        return NextResponse.json(
          { 
            message: `Неподдерживаемый тип файла. Для типа "${fileType}" разрешены расширения: ${allowedExtensions.join(', ')}. Ваш файл: ${file.name} (расширение: ${extension})`,
            receivedType: file.type || 'неизвестный',
            receivedExtension: extension,
            fileName: file.name,
            allowedExtensions: allowedExtensions
          },
          { status: 400 }
        )
      }
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

    console.error('Upload error:', {
      message: error.message,
      stack: error.stack,
      fileName: error.fileName || 'unknown'
    })
    
    // Возвращаем более детальную информацию об ошибке
    const errorMessage = error.message || 'Ошибка при загрузке файла'
    return NextResponse.json(
      { 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

