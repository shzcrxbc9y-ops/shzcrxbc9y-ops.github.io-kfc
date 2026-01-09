import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Удаляю материалы с извлеченным текстом из PDF...\n');
  console.log('📄 Оставляю только PDF файлы для просмотра/скачивания\n');

  // Получаем все материалы
  const allMaterials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  });

  console.log(`📚 Всего материалов: ${allMaterials.length}\n`);

  // Находим материалы, которые были созданы из PDF с извлеченным текстом
  const pdfTextMaterials: any[] = [];
  const pdfFileMaterials: any[] = [];

  // Список PDF файлов из папки
  const pdfFileNames = [
    'easy chek',
    'parametry prigotovleniya',
    'зп рестораны',
    'карточки abr',
    'кликун закрытие',
    'общие стандарты',
    'операционное руководство',
    'руководство бш fd',
    'руководство по устранению',
    'чек лист кликун',
    'чек лист панера',
  ];

  for (const material of allMaterials) {
    const title = material.title.toLowerCase();
    const content = material.content || '';

    // Проверяем, является ли это PDF материалом по названию
    const isPDFMaterial = pdfFileNames.some(name => title.includes(name));

    if (isPDFMaterial) {
      // Если это PDF файл для просмотра/скачивания (с iframe, ссылками или изображениями)
      if (content.includes('iframe') || 
          content.includes('/pdfs/') || 
          content.includes('PDF документ') ||
          content.includes('pdf-images') ||
          content.includes('Страница') ||
          content.includes('<img src="/images/')) {
        pdfFileMaterials.push(material);
      } 
      // Если это PDF с извлеченным текстом (обычный HTML текст без iframe/изображений)
      else if (content.length > 100 && 
               !content.includes('iframe') && 
               !content.includes('/pdfs/') &&
               !content.includes('PDF документ') &&
               !content.includes('pdf-images') &&
               !content.includes('Страница') &&
               !content.includes('<img src="/images/')) {
        pdfTextMaterials.push(material);
      }
    }
  }

  console.log(`📄 PDF файлы для просмотра (оставляем): ${pdfFileMaterials.length}`);
  console.log(`📝 PDF с извлеченным текстом (удаляем): ${pdfTextMaterials.length}\n`);

  if (pdfTextMaterials.length === 0) {
    console.log('✅ Нет материалов для удаления!');
    return;
  }

  // Удаляем материалы с извлеченным текстом
  let deletedCount = 0;
  for (const material of pdfTextMaterials) {
    try {
      console.log(`❌ Удаляю: "${material.title}"`);
      console.log(`   Раздел: ${material.section?.title || 'Без раздела'}`);
      console.log(`   Станция: ${material.section?.station?.name || 'Без станции'}`);
      console.log(`   Длина контента: ${material.content?.length || 0} символов`);

      await prisma.material.delete({
        where: { id: material.id },
      });
      deletedCount++;
    } catch (error: any) {
      console.error(`⚠️  Ошибка при удалении "${material.title}": ${error.message}`);
    }
  }

  // Финальная статистика
  const finalCount = await prisma.material.count();
  console.log(`\n✅ Удаление завершено!`);
  console.log(`📊 Итоговая статистика:`);
  console.log(`   - Удалено материалов с текстом: ${deletedCount}`);
  console.log(`   - Осталось PDF файлов для просмотра: ${pdfFileMaterials.length}`);
  console.log(`   - Всего материалов в базе: ${finalCount}`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

