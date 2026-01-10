import { createUploadthing, type FileRouter } from 'uploadthing/next'

// Получаем переменные окружения
// Приоритет: UPLOADTHING_TOKEN > UPLOADTHING_SECRET + UPLOADTHING_APP_ID
let token: string

if (process.env.UPLOADTHING_TOKEN) {
  // Используем готовый токен напрямую (убираем пробелы)
  token = process.env.UPLOADTHING_TOKEN.trim()
} else if (process.env.UPLOADTHING_SECRET && process.env.UPLOADTHING_APP_ID) {
  // Создаем токен из отдельных переменных
  const apiKey = process.env.UPLOADTHING_SECRET.trim()
  const appId = process.env.UPLOADTHING_APP_ID.trim()

  // Создаем токен в формате base64-encoded JSON
  const tokenData = {
    apiKey: apiKey,
    appId: appId,
    regions: ['auto'], // Используем автоматический выбор региона
  }

  token = Buffer.from(JSON.stringify(tokenData)).toString('base64')
} else {
  throw new Error('Missing UPLOADTHING_TOKEN or (UPLOADTHING_SECRET and UPLOADTHING_APP_ID) environment variables')
}

const f = createUploadthing({
  token: token,
})

export const ourFileRouter = {
  // Загрузка изображений
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for image:', file.url)
      return { uploadedBy: 'admin' }
    }),

  // Загрузка видео
  videoUploader: f({ video: { maxFileSize: '100MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for video:', file.url)
      return { uploadedBy: 'admin' }
    }),

  // Загрузка аудио
  audioUploader: f({ audio: { maxFileSize: '50MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for audio:', file.url)
      return { uploadedBy: 'admin' }
    }),

  // Загрузка PDF и других файлов
  fileUploader: f({ 
    pdf: { maxFileSize: '16MB', maxFileCount: 10 },
    blob: { maxFileSize: '16MB', maxFileCount: 10 }, // Для других типов файлов
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for file:', file.url)
      return { uploadedBy: 'admin' }
    }),

  // Универсальный загрузчик для всех типов файлов
  generalUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 10 },
    video: { maxFileSize: '100MB', maxFileCount: 10 },
    audio: { maxFileSize: '50MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 10 },
    blob: { maxFileSize: '16MB', maxFileCount: 10 },
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete:', file.url)
      return { uploadedBy: 'admin' }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
