import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const INFO_DIR = path.join(process.cwd(), 'информация');

interface FileInfo {
  fileName: string;
  size: number;
  exists: boolean;
  inDatabase: boolean;
  materialId?: string;
  materialTitle?: string;
  hasContent: boolean;
  contentLength?: number;
}

async function main() {
  console.log('🔍 Проверяю все файлы из папки "информация"...\n');

  // Получаем список файлов в папке
  if (!fs.existsSync(INFO_DIR)) {
    console.error(`❌ Папка "${INFO_DIR}" не найдена!`);
    process.exit(1);
  }

  const files = fs.readdirSync(INFO_DIR).filter(file => {
    const filePath = path.join(INFO_DIR, file);
    return fs.statSync(filePath).isFile();
  });

  console.log(`📁 Найдено файлов в папке: ${files.length}\n`);

  // Получаем все материалы из базы данных
  const allMaterials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  });

  console.log(`📚 Материалов в базе данных: ${allMaterials.length}\n`);

  // Проверяем каждый файл
  const fileStatuses: FileInfo[] = [];
  const materialsByFileName = new Map<string, any[]>();

  // Группируем материалы по нормализованному имени файла
  for (const material of allMaterials) {
    // Нормализуем название материала для сравнения с именем файла
    let normalizedName = material.title
      .replace(/\s*\(часть\s+\d+\/\d+\)/gi, '')
      .replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Убираем расширения из имени файла для сравнения
    const fileNameWithoutExt = files.find(f => {
      const fileBase = f.replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '').toLowerCase().trim();
      return fileBase === normalizedName || 
             fileBase.replace(/[_\-\s]+/g, ' ') === normalizedName.replace(/[_\-\s]+/g, ' ');
    });

    if (fileNameWithoutExt) {
      if (!materialsByFileName.has(fileNameWithoutExt)) {
        materialsByFileName.set(fileNameWithoutExt, []);
      }
      materialsByFileName.get(fileNameWithoutExt)!.push(material);
    }
  }

  // Проверяем каждый файл
  for (const file of files) {
    const filePath = path.join(INFO_DIR, file);
    const stats = fs.statSync(filePath);
    const fileBase = file.replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '').toLowerCase().trim();
    
    // Ищем материалы, связанные с этим файлом
    const relatedMaterials = allMaterials.filter(m => {
      const materialBase = m.title
        .replace(/\s*\(часть\s+\d+\/\d+\)/gi, '')
        .replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      
      const fileBaseNormalized = fileBase.replace(/[_\-\s]+/g, ' ');
      const materialBaseNormalized = materialBase.replace(/[_\-\s]+/g, ' ');
      
      return fileBaseNormalized === materialBaseNormalized ||
             fileBase.includes(materialBase) ||
             materialBase.includes(fileBase);
    });

    const inDatabase = relatedMaterials.length > 0;
    const material = relatedMaterials[0];
    const hasContent: boolean = material 
      ? Boolean(material.content && material.content.length > 100 && !material.content.includes('[PDF_FILE]') && !material.content.includes('[PPT_FILE]'))
      : false;
    const contentLength = material?.content?.length || 0;

    fileStatuses.push({
      fileName: file,
      size: stats.size,
      exists: true,
      inDatabase,
      materialId: material?.id,
      materialTitle: material?.title,
      hasContent,
      contentLength,
    });
  }

  // Выводим результаты
  console.log('📊 Статус обработки файлов:\n');
  console.log('='.repeat(80));

  let processedCount = 0;
  let withContentCount = 0;
  let missingCount = 0;

  for (const status of fileStatuses) {
    const sizeKB = (status.size / 1024).toFixed(1);
    const statusIcon = status.inDatabase ? '✅' : '❌';
    const contentIcon = status.hasContent ? '📄' : status.inDatabase ? '📎' : '';
    
    console.log(`\n${statusIcon} ${status.fileName}`);
    console.log(`   Размер: ${sizeKB} KB`);
    
    if (status.inDatabase) {
      processedCount++;
      console.log(`   ✅ В базе данных: Да`);
      console.log(`   📝 Название материала: "${status.materialTitle}"`);
      
      if (status.hasContent) {
        withContentCount++;
        console.log(`   ${contentIcon} Текст извлечен: Да (${status.contentLength} символов)`);
      } else {
        console.log(`   ${contentIcon} Текст извлечен: Нет (файл для скачивания или изображения)`);
      }
    } else {
      missingCount++;
      console.log(`   ❌ В базе данных: НЕТ!`);
      console.log(`   ⚠️  Файл не обработан!`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📈 Итоговая статистика:');
  console.log(`   📁 Всего файлов в папке: ${files.length}`);
  console.log(`   ✅ Обработано и добавлено: ${processedCount}`);
  console.log(`   📄 С извлеченным текстом: ${withContentCount}`);
  console.log(`   📎 Файлы для скачивания/изображения: ${processedCount - withContentCount}`);
  console.log(`   ❌ Не обработано: ${missingCount}`);

  if (missingCount > 0) {
    console.log('\n⚠️  ВНИМАНИЕ: Есть необработанные файлы!');
    console.log('   Запустите: npm run extract-info && npm run integrate-info');
  } else {
    console.log('\n✅ Все файлы обработаны!');
  }
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

