import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';

// Импортируем pdf-parse с использованием require для совместимости
let pdfParse: any;
try {
  pdfParse = require('pdf-parse');
  // Если это не функция, пробуем получить default
  if (typeof pdfParse !== 'function' && pdfParse.default) {
    pdfParse = pdfParse.default;
  }
} catch (e) {
  // Если require не работает, будем пробовать динамический импорт
  pdfParse = null;
}

const INFO_DIR = path.join(process.cwd(), 'информация');

interface ExtractedContent {
  fileName: string;
  fileType: string;
  content: string;
  error?: string;
  images?: Array<{ page: number; index: number; data: Buffer; format: string }>;
}

async function extractPDF(filePath: string): Promise<string> {
  try {
    // pdf-parse версии 2.4.5 использует класс PDFParse
    const { PDFParse } = require('pdf-parse');
    
    // Используем url для файла (работает лучше чем buffer)
    const parser = new PDFParse({ url: filePath });
    const textResult = await parser.getText();
    
    let extractedText = textResult.text || '';
    
    // Если текст очень короткий (меньше 100 символов), пробуем извлечь изображения
    if (extractedText.trim().length < 100) {
      try {
        const imageResult = await parser.getImage({ imageThreshold: 0 });
        // Добавляем информацию об изображениях в текст
        if (imageResult && imageResult.pages) {
          const imageInfo: string[] = [];
          imageResult.pages.forEach((page: any, pageIndex: number) => {
            if (page.images && page.images.length > 0) {
              page.images.forEach((img: any, imgIndex: number) => {
                imageInfo.push(`[IMAGE_PAGE_${pageIndex + 1}_IMG_${imgIndex + 1}]`);
              });
            }
          });
          if (imageInfo.length > 0) {
            extractedText += '\n\n[PDF_CONTAINS_IMAGES:' + imageInfo.join(',') + ']';
          }
        }
      } catch (imgError) {
        // Игнорируем ошибки извлечения изображений
      }
    }
    
    // Освобождаем память
    await parser.destroy();
    
    // Если текст пустой или очень короткий, пробуем извлечь изображения
    if (!extractedText || extractedText.trim().length < 50) {
      // Пробуем извлечь изображения
      try {
        const imageResult = await parser.getImage({ imageThreshold: 0 });
        if (imageResult && imageResult.pages) {
          const hasImages = imageResult.pages.some((page: any) => page.images && page.images.length > 0);
          if (hasImages) {
            // Возвращаем маркер, что есть изображения
            return '[PDF_WITH_IMAGES]';
          }
        }
      } catch (imgError) {
        // Игнорируем ошибки
      }
      // Если изображений нет, возвращаем маркер для файла
      return '[PDF_FILE]';
    }
    
    // Если текст содержит только маркеры страниц и информацию об изображениях, это PDF с изображениями
    const textWithoutMarkers = extractedText.replace(/-- \d+ of \d+ --/g, '').replace(/\[PDF_CONTAINS_IMAGES:.*?\]/g, '').trim();
    if (textWithoutMarkers.length < 50 && extractedText.includes('[PDF_CONTAINS_IMAGES')) {
      return '[PDF_WITH_IMAGES]';
    }
    
    return extractedText;
  } catch (error: any) {
    console.error(`Ошибка при извлечении PDF ${filePath}:`, error.message);
    
    // Пробуем альтернативный способ через data buffer
    try {
      const { PDFParse } = require('pdf-parse');
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const textResult = await parser.getText();
      let extractedText = textResult.text || '';
      
      // Если текст короткий, пробуем извлечь изображения
      let hasImages = false;
      if (!extractedText || extractedText.trim().length < 50) {
        try {
          const imageResult = await parser.getImage({ imageThreshold: 0 });
          if (imageResult && imageResult.pages) {
            hasImages = imageResult.pages.some((page: any) => page.images && page.images.length > 0);
          }
        } catch (imgError) {
          // Игнорируем ошибки
        }
      }
      
      await parser.destroy();
      
      // Если текст короткий, но есть изображения, возвращаем маркер
      if ((!extractedText || extractedText.trim().length < 50) && hasImages) {
        return '[PDF_WITH_IMAGES]';
      }
      
      // Если текст короткий и нет изображений, возвращаем маркер для файла
      if (!extractedText || extractedText.trim().length < 50) {
        return '[PDF_FILE]';
      }
      
      return extractedText;
    } catch (error2: any) {
      console.error(`Ошибка при альтернативном извлечении PDF ${filePath}:`, error2.message);
      // Если не удалось извлечь, возвращаем маркер для файла
      return '[PDF_FILE]';
    }
  }
}

async function extractDOCX(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    throw new Error(`Ошибка при чтении DOCX: ${error}`);
  }
}

function extractXLSX(filePath: string): string {
  try {
    const workbook = XLSX.readFile(filePath);
    let text = '';
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      text += `\n=== Лист: ${sheetName} ===\n`;
      jsonData.forEach((row: any) => {
        if (Array.isArray(row)) {
          text += row.join('\t') + '\n';
        } else {
          text += JSON.stringify(row) + '\n';
        }
      });
    });
    
    return text;
  } catch (error: any) {
    throw new Error(`Ошибка при чтении XLSX: ${error.message}`);
  }
}

async function extractPPTX(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(dataBuffer);
    let text = '';
    
    // PPTX файлы содержат слайды в ppt/slides/slide*.xml
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
    );
    
    for (const slideFile of slideFiles) {
      const slideContent = await zip.files[slideFile].async('string');
      // Простое извлечение текста из XML (удаляем теги)
      const slideText = slideContent
        .replace(/<[^>]+>/g, ' ') // Удаляем все XML теги
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim();
      
      if (slideText.length > 0) {
        text += `\n=== Слайд ${slideFile.match(/slide(\d+)\.xml/)?.[1] || '?'} ===\n`;
        text += slideText + '\n';
      }
    }
    
    return text;
  } catch (error: any) {
    throw new Error(`Ошибка при чтении PPTX: ${error.message}`);
  }
}

async function extractFileContent(filePath: string): Promise<ExtractedContent> {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  try {
    let content = '';
    let fileType = '';
    
    switch (ext) {
      case '.pdf':
        fileType = 'PDF';
        // Извлекаем текст из PDF
        const pdfContent = await extractPDF(filePath);
        content = typeof pdfContent === 'string' ? pdfContent : pdfContent.content || '';
        // Если PDF содержит изображения, извлекаем их
        if (content === '[PDF_WITH_IMAGES]' || (content === '[PDF_FILE]' && typeof pdfContent !== 'string')) {
          try {
            const { PDFParse } = require('pdf-parse');
            const parser = new PDFParse({ url: filePath });
            const imageResult = await parser.getImage({ imageThreshold: 0 });
            await parser.destroy();
            
            if (imageResult && imageResult.pages) {
              const images: Array<{ page: number; index: number; data: Buffer; format: string }> = [];
              imageResult.pages.forEach((page: any, pageIndex: number) => {
                if (page.images && page.images.length > 0) {
                  page.images.forEach((img: any, imgIndex: number) => {
                    if (img.data) {
                      images.push({
                        page: pageIndex + 1,
                        index: imgIndex + 1,
                        data: Buffer.from(img.data),
                        format: img.format || 'png'
                      });
                    }
                  });
                }
              });
              
              if (images.length > 0) {
                return {
                  fileName,
                  fileType,
                  content: '[PDF_WITH_IMAGES]',
                  images
                };
              }
            }
          } catch (imgError) {
            // Игнорируем ошибки извлечения изображений
          }
        }
        break;
      case '.docx':
        fileType = 'DOCX';
        content = await extractDOCX(filePath);
        break;
      case '.xlsx':
      case '.xls':
        fileType = 'XLSX';
        content = extractXLSX(filePath);
        break;
      case '.pptx':
        fileType = 'PPTX';
        content = await extractPPTX(filePath);
        break;
      case '.ppt':
        // Старые PPT файлы сложнее парсить, добавляем как файл для скачивания
        fileType = 'PPT';
        content = '[PPT_FILE]';
        break;
      default:
        return {
          fileName,
          fileType: ext.toUpperCase(),
          content: '',
          error: `Неподдерживаемый формат файла: ${ext}`
        };
    }
    
    return {
      fileName,
      fileType,
      content: content.trim()
    };
  } catch (error: any) {
    return {
      fileName,
      fileType: ext.toUpperCase(),
      content: '',
      error: error.message || 'Неизвестная ошибка'
    };
  }
}

async function main() {
  console.log('Начинаю извлечение информации из файлов...\n');
  
  if (!fs.existsSync(INFO_DIR)) {
    console.error(`Папка "${INFO_DIR}" не найдена!`);
    process.exit(1);
  }
  
  const files = fs.readdirSync(INFO_DIR);
  const results: ExtractedContent[] = [];
  
  for (const file of files) {
    const filePath = path.join(INFO_DIR, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      console.log(`Обрабатываю: ${file}...`);
      const result = await extractFileContent(filePath);
      results.push(result);
      
      if (result.error) {
        console.log(`  ⚠️  Ошибка: ${result.error}`);
      } else {
        console.log(`  ✅ Извлечено ${result.content.length} символов`);
      }
    }
  }
  
  // Сохраняем результаты в JSON файл
  const outputPath = path.join(process.cwd(), 'extracted-info.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  
  console.log(`\n✅ Обработка завершена!`);
  console.log(`📄 Результаты сохранены в: ${outputPath}`);
  console.log(`\nСтатистика:`);
  console.log(`  - Всего файлов: ${results.length}`);
  console.log(`  - Успешно обработано: ${results.filter(r => !r.error).length}`);
  console.log(`  - Ошибок: ${results.filter(r => r.error).length}`);
  console.log(`  - Всего символов: ${results.reduce((sum, r) => sum + r.content.length, 0)}`);
}

main().catch(console.error);

