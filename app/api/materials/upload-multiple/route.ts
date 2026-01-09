import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(request: NextRequest) {
  try {
    await requireAuth('ADMIN')

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const fileType = formData.get('fileType') as string

    if (!files || files.length === 0) {
      return NextResponse.json(
        { message: 'Файлы не предоставлены' },
        { status: 400 }
      )
    }

    // Определяем директорию для загрузки
    let uploadDir = 'public'
    let allowedTypes: string[] = []

    switch (fileType) {
      case 'video':
        uploadDir = 'public/videos'
        allowedTypes = ALLOWED_VIDEO_TYPES
        break
      case 'audio':
        uploadDir = 'public/audio'
        allowedTypes = ALLOWED_AUDIO_TYPES
        break
      case 'image':
        uploadDir = 'public/images'
        allowedTypes = ALLOWED_IMAGE_TYPES
        break
      case 'pdf':
      case 'file':
        uploadDir = 'public/files'
        allowedTypes = ALLOWED_DOC_TYPES
        break
      default:
        return NextResponse.json(
          { message: 'Неверный тип файла' },
          { status: 400 }
        )
    }

    // Создаем директорию, если её нет
    const uploadPath = join(process.cwd(), uploadDir)
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true })
    }

    const uploadedFiles = []
    const errors: string[] = []

    // Обрабатываем каждый файл с обработкой ошибок
    for (const file of files) {
      try {
        // Проверяем размер
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: файл слишком большой (максимум 100MB)`)
          continue
        }

        // Проверяем MIME тип
        if (!allowedTypes.includes(file.type)) {
          errors.push(`${file.name}: неподдерживаемый тип файла`)
          continue
        }

        // Генерируем уникальное имя файла
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 9)
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}_${random}_${sanitizedName}`
        const filePath = join(uploadPath, fileName)

        // Сохраняем файл с обработкой ошибок
        try {
          const bytes = await file.arrayBuffer()
          const buffer = Buffer.from(bytes)
          await writeFile(filePath, buffer)

          // Проверяем, что файл действительно сохранен
          if (!existsSync(filePath)) {
            throw new Error('Файл не был сохранен на диск')
          }

          // Добавляем информацию о файле
          const fileUrl = `/${uploadDir.replace('public/', '')}/${fileName}`
          uploadedFiles.push({
            url: fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
          })
        } catch (writeError: any) {
          errors.push(`${file.name}: ошибка записи файла - ${writeError.message}`)
          console.error(`Error writing file ${file.name}:`, writeError)
        }
      } catch (fileError: any) {
        errors.push(`${file.name}: ${fileError.message || 'Неизвестная ошибка'}`)
        console.error(`Error processing file ${file.name}:`, fileError)
      }
    }

    // Возвращаем результат даже если были ошибки, но хотя бы один файл загружен
    if (uploadedFiles.length > 0) {
      return NextResponse.json({
        message: `Успешно загружено ${uploadedFiles.length} из ${files.length} файл(ов)`,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined,
      })
    }

    // Если ни один файл не загружен, возвращаем ошибку
    return NextResponse.json(
      { 
        message: 'Не удалось загрузить ни один файл',
        errors: errors.length > 0 ? errors : ['Неизвестная ошибка при загрузке файлов'],
      },
      { status: 400 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { message: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      )
    }

    console.error('Upload error:', error)
    return NextResponse.json(
      { message: 'Ошибка при загрузке файлов' },
      { status: 500 }
    )
  }
}
