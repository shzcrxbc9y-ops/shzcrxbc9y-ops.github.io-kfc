import { createUploadthing, type FileRouter } from 'uploadthing/next'

// UploadThing автоматически использует переменные окружения:
// - UPLOADTHING_TOKEN (base64-encoded JSON с apiKey, appId, regions)
// - или UPLOADTHING_SECRET и UPLOADTHING_APP_ID
// Токен не нужно передавать напрямую в createUploadthing
const f = createUploadthing()

export const ourFileRouter = {
  // Загрузка изображений
  imageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for image:', file.url)
      return { uploadedBy: 'admin' }
    }),

  // Загрузка видео
  videoUploader: f({ video: { maxFileSize: '64MB', maxFileCount: 10 } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for video:', file.url)
      return { uploadedBy: 'admin' }
    }),

  // Загрузка аудио
  audioUploader: f({ audio: { maxFileSize: '32MB', maxFileCount: 10 } })
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
    video: { maxFileSize: '64MB', maxFileCount: 10 },
    audio: { maxFileSize: '32MB', maxFileCount: 10 },
    pdf: { maxFileSize: '16MB', maxFileCount: 10 },
    blob: { maxFileSize: '16MB', maxFileCount: 10 },
  })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete:', file.url)
      return { uploadedBy: 'admin' }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
