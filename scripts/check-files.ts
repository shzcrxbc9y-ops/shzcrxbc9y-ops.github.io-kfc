import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const INFO_DIR = path.join(process.cwd(), 'информация');

interface FileStatus {
  fileName: string;
  status: 'added' | 'not_added' | 'error';
  reason?: string;
}

async function main() {
  console.log('🔍 Проверяю, какие файлы добавлены в базу данных...\n');

  // Получаем список всех файлов в папке
  const allFiles = fs.readdirSync(INFO_DIR).filter(file => {
    const filePath = path.join(INFO_DIR, file);
    return fs.statSync(filePath).isFile();
  });

  // Получаем все материалы из базы данных
  const materials = await prisma.material.findMany({
    select: {
      title: true,
    },
  });

  // Создаем мапу названий материалов (убираем расширения и части)
  const materialTitles = new Set(
    materials.map(m => {
      // Убираем "(часть X/Y)" из названия
      return m.title.replace(/\s*\(часть\s+\d+\/\d+\)/gi, '').trim();
    })
  );

  // Читаем extracted-info.json для проверки ошибок
  const extractedInfoPath = path.join(process.cwd(), 'extracted-info.json');
  const extractedData: any[] = fs.existsSync(extractedInfoPath)
    ? JSON.parse(fs.readFileSync(extractedInfoPath, 'utf-8'))
    : [];

  const fileErrors = new Map<string, string>();
  extractedData.forEach(item => {
    if (item.error) {
      fileErrors.set(item.fileName, item.error);
    }
  });

  const fileStatuses: FileStatus[] = [];

  for (const file of allFiles) {
    const fileNameWithoutExt = file.replace(/\.(pdf|docx|pptx|ppt|xlsx|xls)$/i, '');
    
    // Проверяем, есть ли материал с таким названием
    let found = false;
    for (const title of materialTitles) {
      if (title.toLowerCase().includes(fileNameWithoutExt.toLowerCase()) || 
          fileNameWithoutExt.toLowerCase().includes(title.toLowerCase().replace(/\s+/g, ''))) {
        found = true;
        break;
      }
    }

    // Также проверяем точное совпадение
    if (!found) {
      for (const title of materialTitles) {
        if (title.toLowerCase() === fileNameWithoutExt.toLowerCase()) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      fileStatuses.push({
        fileName: file,
        status: 'added',
      });
    } else if (fileErrors.has(file)) {
      fileStatuses.push({
        fileName: file,
        status: 'error',
        reason: fileErrors.get(file),
      });
    } else {
      fileStatuses.push({
        fileName: file,
        status: 'not_added',
      });
    }
  }

  // Группируем по статусу
  const added = fileStatuses.filter(f => f.status === 'added');
  const notAdded = fileStatuses.filter(f => f.status === 'not_added');
  const errors = fileStatuses.filter(f => f.status === 'error');

  console.log('✅ ДОБАВЛЕНЫ В БАЗУ ДАННЫХ:');
  console.log(`   Всего: ${added.length} файлов\n`);
  added.forEach(file => {
    console.log(`   ✓ ${file.fileName}`);
  });

  console.log('\n❌ НЕ ДОБАВЛЕНЫ (ошибки при извлечении):');
  console.log(`   Всего: ${errors.length} файлов\n`);
  errors.forEach(file => {
    console.log(`   ✗ ${file.fileName}`);
    console.log(`     Причина: ${file.reason}`);
  });

  console.log('\n⚠️  НЕ ДОБАВЛЕНЫ (не обработаны):');
  console.log(`   Всего: ${notAdded.length} файлов\n`);
  notAdded.forEach(file => {
    console.log(`   ? ${file.fileName}`);
  });

  console.log('\n📊 ИТОГО:');
  console.log(`   Всего файлов: ${allFiles.length}`);
  console.log(`   ✅ Добавлено: ${added.length}`);
  console.log(`   ❌ Ошибки: ${errors.length}`);
  console.log(`   ⚠️  Не обработано: ${notAdded.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

