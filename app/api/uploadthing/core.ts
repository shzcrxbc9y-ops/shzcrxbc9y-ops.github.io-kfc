import { createUploadthing, type FileRouter } from 'uploadthing/next'

// Получаем переменные окружения
// Если UPLOADTHING_TOKEN уже существует (base64-encoded JSON), используем его напрямую
// Иначе создаем токен из UPLOADTHING_SECRET и UPLOADTHING_APP_ID
let token: string

if (process.env.UPLOADTHING_TOKEN) {
  // Используем готовый токен напрямую
  token = process.env.UPLOADTHING_TOKEN
} else {
  // Создаем токен из отдельных переменных
  const apiKey = process.env.UPLOADTHING_SECRET
  const appId = process.env.UPLOADTHING_APP_ID

  if (!apiKey) {
    throw new Error('Missing UPLOADTHING_SECRET or UPLOADTHING_TOKEN environment variable')
  }

  if (!appId) {
    throw new Error('Missing UPLOADTHING_APP_ID environment variable')
  }

  // Создаем токен в формате base64-encoded JSON
  const tokenData = {
    apiKey: apiKey,
    appId: appId,
    regions: ['auto'], // Используем автоматический выбор региона
  }

  token = Buffer.from(JSON.stringify(tokenData)).toString('base64')
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
