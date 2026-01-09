import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const INFO_DIR = path.join(process.cwd(), 'информация');

interface ExtractedContent {
  fileName: string;
  fileType: string;
  content: string;
  error?: string;
}

// Функция для разбиения длинного текста на части
function splitContent(content: string, maxLength: number = 5000): string[] {
  if (content.length <= maxLength) {
    return [content];
  }
  
  const parts: string[] = [];
  const paragraphs = content.split('\n\n');
  let currentPart = '';
  
  for (const paragraph of paragraphs) {
    if ((currentPart + paragraph).length > maxLength && currentPart.length > 0) {
      parts.push(currentPart.trim());
      currentPart = paragraph + '\n\n';
    } else {
      currentPart += paragraph + '\n\n';
    }
  }
  
  if (currentPart.trim().length > 0) {
    parts.push(currentPart.trim());
  }
  
  return parts;
}

// Функция для определения станции и раздела по имени файла
function categorizeFile(fileName: string): { station: string; section: string } {
  const lowerName = fileName.toLowerCase();
  
  // Станция Касса (Кликун)
  if (lowerName.includes('кликун') || lowerName.includes('click') || lowerName.includes('касса') || lowerName.includes('касс')) {
    if (lowerName.includes('чек') || lowerName.includes('чек-лист') || lowerName.includes('checklist')) {
      return { station: 'Станция кассы', section: 'Чек-листы' };
    }
    if (lowerName.includes('рутин') || lowerName.includes('routine')) {
      return { station: 'Станция кассы', section: 'Рутины' };
    }
    if (lowerName.includes('закрытие') || lowerName.includes('передача') || lowerName.includes('смен')) {
      return { station: 'Станция кассы', section: 'Закрытие и передача смены' };
    }
    if (lowerName.includes('операционн') || lowerName.includes('руководство')) {
      return { station: 'Станция кассы', section: 'Операционное руководство' };
    }
    if (lowerName.includes('функционал')) {
      return { station: 'Станция кассы', section: 'Функционал системы' };
    }
    return { station: 'Станция кассы', section: 'Основы работы' };
  }
  
  // Станция Панировка
  if (lowerName.includes('паниров') || lowerName.includes('панера') || lowerName.includes('paner')) {
    if (lowerName.includes('чек') || lowerName.includes('чек-лист')) {
      return { station: 'Станция кухни', section: 'Чек-листы панировки' };
    }
    if (lowerName.includes('справочник') || lowerName.includes('модул')) {
      return { station: 'Станция кухни', section: 'Справочники' };
    }
    if (lowerName.includes('сроки') || lowerName.includes('хранен')) {
      return { station: 'Станция кухни', section: 'Сроки хранения' };
    }
    return { station: 'Станция кухни', section: 'Панировка' };
  }
  
  // Станция Кухня
  if (lowerName.includes('кухн') || lowerName.includes('kitchen') || lowerName.includes('бш') || lowerName.includes('fd')) {
    if (lowerName.includes('руководство') || lowerName.includes('бш')) {
      return { station: 'Станция кухни', section: 'Руководства' };
    }
    if (lowerName.includes('параметр') || lowerName.includes('приготовлен')) {
      return { station: 'Станция кухни', section: 'Параметры приготовления' };
    }
    if (lowerName.includes('сроки') || lowerName.includes('хранен')) {
      return { station: 'Станция кухни', section: 'Сроки хранения' };
    }
    if (lowerName.includes('устранен') || lowerName.includes('проблем') || lowerName.includes('куриц')) {
      return { station: 'Станция кухни', section: 'Устранение проблем' };
    }
    return { station: 'Станция кухни', section: 'Основы работы' };
  }
  
  // Общие стандарты
  if (lowerName.includes('общие') || lowerName.includes('стандарт')) {
    return { station: 'Общие стандарты', section: 'Стандарты работы' };
  }
  
  if (lowerName.includes('справочник') || lowerName.includes('единый')) {
    return { station: 'Общие стандарты', section: 'Справочники' };
  }
  
  if (lowerName.includes('сроки') || lowerName.includes('хранен')) {
    return { station: 'Общие стандарты', section: 'Сроки хранения' };
  }
  
  if (lowerName.includes('тайгет') || lowerName.includes('химия') || lowerName.includes('дезинфек')) {
    return { station: 'Общие стандарты', section: 'Химия и дезинфекция' };
  }
  
  if (lowerName.includes('красочн') || lowerName.includes('описание')) {
    return { station: 'Общие стандарты', section: 'Описания продуктов' };
  }
  
  if (lowerName.includes('зп') || lowerName.includes('ресторан')) {
    return { station: 'Общие стандарты', section: 'Зарплата и рестораны' };
  }
  
  if (lowerName.includes('l3') || lowerName.includes('тренинг') || lowerName.includes('тренер')) {
    return { station: 'Общие стандарты', section: 'Обучение и тренинги' };
  }
  
  if (lowerName.includes('шпаргалка') || lowerName.includes('орс')) {
    return { station: 'Общие стандарты', section: 'Шпаргалки' };
  }
  
  if (lowerName.includes('easy') || lowerName.includes('check')) {
    return { station: 'Общие стандарты', section: 'Чек-листы' };
  }
  
  if (lowerName.includes('карточк') || lowerName.includes('abr')) {
    return { station: 'Общие стандарты', section: 'Карточки' };
  }
  
  // По умолчанию
  return { station: 'Общие стандарты', section: 'Дополнительные материалы' };
}

async function main() {
  console.log('Начинаю интеграцию информации в базу данных...\n');
  
  // Читаем извлеченную информацию
  const extractedInfoPath = path.join(process.cwd(), 'extracted-info.json');
  if (!fs.existsSync(extractedInfoPath)) {
    console.error('Файл extracted-info.json не найден! Сначала запустите npm run extract-info');
    process.exit(1);
  }
  
  const extractedData: ExtractedContent[] = JSON.parse(
    fs.readFileSync(extractedInfoPath, 'utf-8')
  );
  
  // Фильтруем файлы: успешно извлеченные ИЛИ PDF/PPT файлы (даже если была ошибка)
  const successfulFiles = extractedData.filter(f => {
    const isPDF = f.fileName.toLowerCase().endsWith('.pdf');
    const isPPT = f.fileName.toLowerCase().endsWith('.ppt');
    // Включаем PDF и PPT файлы даже если была ошибка, так как мы их обработаем отдельно
    return (!f.error && f.content.length > 0) || ((isPDF || isPPT) && f.error);
  });
  
  console.log(`Найдено ${successfulFiles.length} успешно извлеченных файлов из ${extractedData.length} всего\n`);
  
  // Создаем станции
  const stationsMap = new Map<string, string>();
  
  for (const file of successfulFiles) {
    const { station } = categorizeFile(file.fileName);
    if (!stationsMap.has(station)) {
      // Проверяем, существует ли станция
      let stationRecord = await prisma.station.findFirst({
        where: { name: station },
      });
      
      if (!stationRecord) {
        stationRecord = await prisma.station.create({
          data: {
            name: station,
            description: `Станция: ${station}`,
            order: stationsMap.size,
          },
        });
        console.log(`✅ Создана станция: ${station}`);
      } else {
        console.log(`ℹ️  Станция уже существует: ${station}`);
      }
      
      stationsMap.set(station, stationRecord.id);
    }
  }
  
  // Создаем разделы для каждой станции
  const sectionsMap = new Map<string, { sectionId: string; stationId: string }>();
  
  for (const file of successfulFiles) {
    const { station, section } = categorizeFile(file.fileName);
    const stationId = stationsMap.get(station)!;
    const sectionKey = `${stationId}-${section}`;
    
    if (!sectionsMap.has(sectionKey)) {
      // Проверяем, существует ли раздел
      let sectionRecord = await prisma.section.findFirst({
        where: { 
          title: section,
          stationId: stationId,
        },
      });
      
      if (!sectionRecord) {
        sectionRecord = await prisma.section.create({
          data: {
            title: section,
            description: `Раздел: ${section}`,
            stationId: stationId,
            order: sectionsMap.size,
          },
        });
        console.log(`✅ Создан раздел: ${section} (станция: ${station})`);
      } else {
        console.log(`ℹ️  Раздел уже существует: ${section} (станция: ${station})`);
      }
      
      sectionsMap.set(sectionKey, { sectionId: sectionRecord.id, stationId });
    }
  }
  
  // Создаем папку для PDF файлов в public
  const publicDir = path.join(process.cwd(), 'public');
  const pdfDir = path.join(publicDir, 'pdfs');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  // Создаем материалы
  let materialCount = 0;
  
  for (const file of successfulFiles) {
    const { station, section } = categorizeFile(file.fileName);
    const stationId = stationsMap.get(station)!;
    const sectionKey = `${stationId}-${section}`;
    const sectionInfo = sectionsMap.get(sectionKey)!;
    
    // Проверяем, является ли это PDF или PPT файлом (для скачивания)
    const isPDFFile = file.fileName.toLowerCase().endsWith('.pdf');
    const isPPTFile = file.fileName.toLowerCase().endsWith('.ppt');
    const isPPTXFile = file.fileName.toLowerCase().endsWith('.pptx');
    const isPDFForDownload = isPDFFile && file.content === '[PDF_FILE]';
    const isPDFWithImages = isPDFFile && (file.content === '[PDF_WITH_IMAGES]' || file.content.includes('[PDF_CONTAINS_IMAGES'));
    // PPT и PPTX файлы теперь всегда обрабатываются как контент для отображения, а не для скачивания
    const isPPTForDownload = false; // Больше не используем для скачивания
    const isFileForDownload = isPDFForDownload;
    
    // Если PDF файл с изображениями, извлекаем и сохраняем изображения
    if (isPDFWithImages) {
      // Пробуем извлечь изображения из PDF
      try {
        const { PDFParse } = require('pdf-parse');
        const sourcePath = path.join(INFO_DIR, file.fileName);
        const parser = new PDFParse({ url: sourcePath });
        const imageResult = await parser.getImage({ imageThreshold: 0 });
        await parser.destroy();
        
        if (imageResult && imageResult.pages) {
          const hasImages = imageResult.pages.some((page: any) => page.images && page.images.length > 0);
          
          if (hasImages) {
            // Сохраняем изображения
            const imagesDir = path.join(publicDir, 'images');
            if (!fs.existsSync(imagesDir)) {
              fs.mkdirSync(imagesDir, { recursive: true });
            }
            
            const fileNameBase = file.fileName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
            const imageUrls: string[] = [];
            let imageIndex = 0;
            
            // Сохраняем каждое изображение
            imageResult.pages.forEach((page: any, pageIndex: number) => {
              if (page.images && page.images.length > 0) {
                page.images.forEach((img: any, imgIdx: number) => {
                  if (img.data) {
                    imageIndex++;
                    const imageFileName = `${fileNameBase}_page${pageIndex + 1}_img${imgIdx + 1}.${img.format || 'png'}`;
                    const imagePath = path.join(imagesDir, imageFileName);
                    fs.writeFileSync(imagePath, Buffer.from(img.data));
                    imageUrls.push({ url: `/images/${imageFileName}`, page: pageIndex + 1, index: imgIdx + 1 });
                  }
                });
              }
            });
            
            if (imageUrls.length > 0) {
              // Создаем HTML контент с изображениями
              const title = file.fileName.replace(/\.pdf$/i, '');
              let htmlContent = `<div class="pdf-images">\n<h3>📄 ${file.fileName}</h3>\n`;
              
              // Группируем изображения по страницам
              const imagesByPage = new Map<number, string[]>();
              imageUrls.forEach((img) => {
                if (!imagesByPage.has(img.page)) {
                  imagesByPage.set(img.page, []);
                }
                imagesByPage.get(img.page)!.push(img.url);
              });
              
              // Добавляем изображения по страницам
              Array.from(imagesByPage.entries()).sort((a, b) => a[0] - b[0]).forEach(([pageNum, urls]) => {
                htmlContent += `<div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px;">\n`;
                htmlContent += `<h4>Страница ${pageNum}</h4>\n`;
                urls.forEach(url => {
                  htmlContent += `<img src="${url}" alt="Страница ${pageNum}" style="max-width: 100%; height: auto; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;" />\n`;
                });
                htmlContent += `</div>\n`;
              });
              
              htmlContent += `</div>`;
              
              await prisma.material.create({
                data: {
                  sectionId: sectionInfo.sectionId,
                  title: title,
                  content: htmlContent,
                  type: 'text',
                  order: materialCount++,
                },
              });
              
              console.log(`✅ Создан PDF материал с изображениями: ${file.fileName} (${imageUrls.length} изображений)`);
              continue; // Пропускаем дальнейшую обработку этого файла
            }
          }
        }
      } catch (imgError: any) {
        console.error(`⚠️  Ошибка при извлечении изображений из ${file.fileName}:`, imgError.message);
        // Продолжаем обработку как обычный PDF файл
      }
    }
    
    // Если PDF файл с изображениями, сохраняем изображения и создаем материал
    if (false) { // Этот блок больше не используется, но оставляю для совместимости
      const images = (file as any).images as Array<{ page: number; index: number; data: Buffer; format: string }>;
      const imagesDir = path.join(publicDir, 'images');
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      const fileNameBase = file.fileName.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      const imageUrls: string[] = [];
      
      // Сохраняем каждое изображение
      for (const img of images) {
        const imageFileName = `${fileNameBase}_page${img.page}_img${img.index}.${img.format}`;
        const imagePath = path.join(imagesDir, imageFileName);
        fs.writeFileSync(imagePath, img.data);
        imageUrls.push(`/images/${imageFileName}`);
      }
      
      // Создаем HTML контент с изображениями
      const title = file.fileName.replace(/\.pdf$/i, '');
      let htmlContent = `<div class="pdf-images">\n<h3>📄 ${file.fileName}</h3>\n`;
      
      // Группируем изображения по страницам
      const imagesByPage = new Map<number, string[]>();
      images.forEach((img, idx) => {
        if (!imagesByPage.has(img.page)) {
          imagesByPage.set(img.page, []);
        }
        imagesByPage.get(img.page)!.push(imageUrls[idx]);
      });
      
      // Добавляем изображения по страницам
      Array.from(imagesByPage.entries()).sort((a, b) => a[0] - b[0]).forEach(([pageNum, urls]) => {
        htmlContent += `<div style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px;">\n`;
        htmlContent += `<h4>Страница ${pageNum}</h4>\n`;
        urls.forEach(url => {
          htmlContent += `<img src="${url}" alt="Страница ${pageNum}" style="max-width: 100%; height: auto; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;" />\n`;
        });
        htmlContent += `</div>\n`;
      });
      
      htmlContent += `</div>`;
      
      await prisma.material.create({
        data: {
          sectionId: sectionInfo.sectionId,
          title: title,
          content: htmlContent,
          type: 'text',
          order: materialCount++,
        },
      });
      
      console.log(`✅ Создан PDF материал с изображениями: ${file.fileName} (${images.length} изображений)`);
    }
    // Если PDF файл, но текст извлечен, обрабатываем как обычный материал
    else if (isPDFFile && !isPDFForDownload && !isPDFWithImages && file.content && file.content !== '[PDF_FILE]') {
      // Обрабатываем PDF с извлеченным текстом как обычный материал
      const contentParts = splitContent(file.content, 10000);
      
      for (let i = 0; i < contentParts.length; i++) {
        const title = contentParts.length > 1 
          ? `${file.fileName.replace(/\.pdf$/i, '')} (часть ${i + 1}/${contentParts.length})`
          : file.fileName.replace(/\.pdf$/i, '');
        
        // Преобразуем текст в HTML
        let htmlContent = contentParts[i]
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '<br>';
            const escaped = trimmed
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
            return `<p>${escaped}</p>`;
          })
          .join('\n');
        
        await prisma.material.create({
          data: {
            sectionId: sectionInfo.sectionId,
            title: title,
            content: htmlContent,
            type: 'text',
            order: materialCount++,
          },
        });
      }
      
      console.log(`✅ Создан PDF материал с текстом: ${file.fileName} (${contentParts.length} частей)`);
    } else if (isFileForDownload) {
      // Для PDF и PPT файлов копируем файл и создаем материал с ссылкой
      const sourcePath = path.join(INFO_DIR, file.fileName);
      const fileNameSafe = file.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      
      // Создаем папку для файлов (pdfs для PDF, presentations для PPT)
      const fileDir = isPDFForDownload ? pdfDir : path.join(publicDir, 'presentations');
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      
      const destPath = path.join(fileDir, fileNameSafe);
      const fileUrl = isPDFForDownload ? `/pdfs/${fileNameSafe}` : `/presentations/${fileNameSafe}`;
      
      // Определяем тип файла до блока try-catch
      const fileTypeName = isPDFForDownload ? 'PDF' : 'PowerPoint';
      const fileIcon = isPDFForDownload ? '📄' : '📊';
      
      try {
        fs.copyFileSync(sourcePath, destPath);
        
        const title = file.fileName.replace(/\.(pdf|ppt)$/i, '');
        
        let htmlContent = '';
        if (isPDFForDownload) {
          // Для PDF добавляем iframe для просмотра
          htmlContent = `
            <div class="file-viewer">
              <h3>${fileIcon} ${fileTypeName} документ: ${file.fileName}</h3>
              <p>Вы можете просмотреть или скачать этот ${fileTypeName} файл:</p>
              <div class="file-actions" style="margin: 20px 0;">
                <a href="${fileUrl}" target="_blank" 
                   style="display: inline-block; padding: 10px 20px; background: #e62e2e; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                  ${fileIcon} Открыть ${fileTypeName}
                </a>
                <a href="${fileUrl}" download 
                   style="display: inline-block; padding: 10px 20px; background: #666; color: white; text-decoration: none; border-radius: 5px;">
                  ⬇️ Скачать ${fileTypeName}
                </a>
              </div>
              <iframe src="${fileUrl}" 
                      style="width: 100%; height: 800px; border: 1px solid #ddd; border-radius: 5px; margin-top: 20px;"
                      title="${file.fileName}">
                <p>Ваш браузер не поддерживает просмотр ${fileTypeName}. 
                   <a href="${fileUrl}" target="_blank">Откройте ${fileTypeName} в новом окне</a> или 
                   <a href="${fileUrl}" download>скачайте файл</a>.
                </p>
              </iframe>
            </div>
          `;
        } else {
          // Для PPT только кнопки скачивания (нельзя просмотреть в iframe)
          htmlContent = `
            <div class="file-viewer">
              <h3>${fileIcon} ${fileTypeName} презентация: ${file.fileName}</h3>
              <p>Вы можете скачать эту ${fileTypeName} презентацию:</p>
              <div class="file-actions" style="margin: 20px 0;">
                <a href="${fileUrl}" download 
                   style="display: inline-block; padding: 10px 20px; background: #e62e2e; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">
                  ${fileIcon} Скачать ${fileTypeName} презентацию
                </a>
                <a href="${fileUrl}" target="_blank" 
                   style="display: inline-block; padding: 10px 20px; background: #666; color: white; text-decoration: none; border-radius: 5px;">
                  🔗 Открыть в новом окне
                </a>
              </div>
              <div style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 5px;">
                <p><strong>Примечание:</strong> Для просмотра ${fileTypeName} файла (.ppt) вам понадобится программа Microsoft PowerPoint или совместимое приложение.</p>
              </div>
            </div>
          `;
        }
        
        await prisma.material.create({
          data: {
            sectionId: sectionInfo.sectionId,
            title: title,
            content: htmlContent,
            type: 'text',
            order: materialCount++,
          },
        });
        
        console.log(`✅ Создан ${fileTypeName} материал: ${file.fileName}`);
      } catch (error: any) {
        console.error(`❌ Ошибка при копировании ${fileTypeName} ${file.fileName}:`, error.message);
      }
    } else if (isPPTXFile || (isPPTFile && file.content && file.content !== '[PPT_FILE]')) {
      // Для PPTX и PPT файлов с извлеченным содержимым создаем красивое форматирование
      const title = file.fileName.replace(/\.(pptx|ppt)$/i, '');
      
      // Форматируем содержимое презентации
      let htmlContent = `<div class="presentation-content">\n<h2>📊 ${title}</h2>\n`;
      
      // Разбиваем на слайды (PPTX файлы имеют маркеры "=== Слайд X ===")
      const slides = file.content.split(/=== Слайд \d+ ===/).filter(s => s.trim().length > 0);
      
      if (slides.length > 0) {
        // Если есть маркеры слайдов, форматируем каждый слайд отдельно
        const slideMatches = file.content.match(/=== Слайд \d+ ===/g) || [];
        const slideContents = file.content.split(/=== Слайд \d+ ===/).slice(1);
        
        slideMatches.forEach((marker, index) => {
          const slideNum = marker.match(/\d+/)?.[0] || (index + 1).toString();
          const slideContent = slideContents[index] || '';
          
          htmlContent += `<div class="slide" style="margin: 30px 0; padding: 20px; background: #ffffff; border-left: 4px solid #e62e2e; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">\n`;
          htmlContent += `<h3 style="color: #e62e2e; margin-top: 0;">Слайд ${slideNum}</h3>\n`;
          
          // Форматируем содержимое слайда
          const formattedContent = slideContent
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
              const trimmed = line.trim();
              const escaped = trimmed
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
              
              // Определяем, является ли строка заголовком (короткая строка или с двоеточием)
              if (trimmed.length < 100 && (trimmed.endsWith(':') || !trimmed.includes('.') || trimmed.match(/^[А-ЯЁ]/))) {
                return `<h4 style="margin: 15px 0 10px 0; color: #333;">${escaped}</h4>`;
              }
              
              // Списки (строки начинающиеся с цифры и точки или дефиса)
              if (trimmed.match(/^[\d•\-\*]\s/)) {
                return `<li style="margin: 8px 0; padding-left: 10px;">${escaped}</li>`;
              }
              
              return `<p style="margin: 10px 0; line-height: 1.6; color: #555;">${escaped}</p>`;
            })
            .join('\n');
          
          htmlContent += formattedContent;
          htmlContent += `</div>\n`;
        });
      } else {
        // Если нет маркеров слайдов, просто форматируем как обычный текст
        const formattedContent = file.content
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '<br>';
            const escaped = trimmed
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
            return `<p style="margin: 10px 0; line-height: 1.6;">${escaped}</p>`;
          })
          .join('\n');
        
        htmlContent += formattedContent;
      }
      
      htmlContent += `</div>`;
      
      await prisma.material.create({
        data: {
          sectionId: sectionInfo.sectionId,
          title: title,
          content: htmlContent,
          type: 'text',
          order: materialCount++,
        },
      });
      
      console.log(`✅ Создан материал презентации: ${file.fileName}`);
    } else if (isPPTFile && file.content === '[PPT_FILE]') {
      // Для старых PPT файлов, которые не удалось извлечь, показываем сообщение
      const title = file.fileName.replace(/\.ppt$/i, '');
      const htmlContent = `
        <div class="presentation-info" style="padding: 20px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; margin: 20px 0;">
          <h3>📊 ${title}</h3>
          <p style="color: #856404; line-height: 1.6;">
            <strong>Примечание:</strong> Этот файл в старом формате PowerPoint (.ppt). 
            Для просмотра содержимого на сайте рекомендуется конвертировать его в формат .pptx.
          </p>
          <p style="color: #856404; margin-top: 15px;">
            Если у вас есть доступ к Microsoft PowerPoint, вы можете открыть файл и сохранить его в формате .pptx, 
            после чего повторно загрузить в систему.
          </p>
        </div>
      `;
      
      await prisma.material.create({
        data: {
          sectionId: sectionInfo.sectionId,
          title: title,
          content: htmlContent,
          type: 'text',
          order: materialCount++,
        },
      });
      
      console.log(`✅ Создан информационный материал для PPT: ${file.fileName}`);
    } else {
      // Для остальных файлов извлекаем текст
      // Разбиваем контент на части, если он слишком длинный
      const contentParts = splitContent(file.content, 10000);
      
      for (let i = 0; i < contentParts.length; i++) {
        const title = contentParts.length > 1 
          ? `${file.fileName} (часть ${i + 1}/${contentParts.length})`
          : file.fileName.replace(/\.(docx|xlsx|pdf)$/i, '');
        
        // Преобразуем текст в HTML (сохраняем переносы строк и форматирование)
        const htmlContent = contentParts[i]
          .split('\n')
          .map(line => {
            const trimmed = line.trim();
            if (!trimmed) return '<br>';
            // Экранируем HTML символы
            const escaped = trimmed
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
            return `<p>${escaped}</p>`;
          })
          .join('\n');
        
        await prisma.material.create({
          data: {
            sectionId: sectionInfo.sectionId,
            title: title,
            content: htmlContent,
            type: 'text',
            order: materialCount++,
          },
        });
      }
      
      console.log(`✅ Создан материал: ${file.fileName} (${contentParts.length} частей)`);
    }
  }
  
  console.log(`\n✅ Интеграция завершена!`);
  console.log(`📊 Статистика:`);
  console.log(`   - Станций создано: ${stationsMap.size}`);
  console.log(`   - Разделов создано: ${sectionsMap.size}`);
  console.log(`   - Материалов создано: ${materialCount}`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

