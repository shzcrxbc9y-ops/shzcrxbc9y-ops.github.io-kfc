import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Проверяю PDF материалы в базе данных...\n');

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

  // Находим все PDF материалы
  const pdfMaterials: any[] = [];

  for (const material of allMaterials) {
    const title = material.title.toLowerCase();
    const content = material.content || '';

    // Проверяем, является ли это PDF материалом по названию файлов из папки
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

    const isPDFFile = pdfFileNames.some(name => title.includes(name));

    if (isPDFFile) {
      pdfMaterials.push({
        id: material.id,
        title: material.title,
        contentLength: content.length,
        hasIframe: content.includes('iframe'),
        hasPdfLink: content.includes('/pdfs/'),
        hasImages: content.includes('pdf-images') || content.includes('Страница'),
        isTextContent: content.length > 100 && 
                      !content.includes('iframe') && 
                      !content.includes('/pdfs/') &&
                      !content.includes('pdf-images') &&
                      !content.includes('Страница'),
        section: material.section?.title,
        station: material.section?.station?.name,
        contentPreview: content.substring(0, 200),
      });
    }
  }

  console.log(`📄 Найдено PDF материалов: ${pdfMaterials.length}\n`);
  console.log('='.repeat(80));

  let fileMaterials = 0;
  let textMaterials = 0;
  let imageMaterials = 0;

  for (const pdf of pdfMaterials) {
    console.log(`\n📄 "${pdf.title}"`);
    console.log(`   Раздел: ${pdf.section || 'Без раздела'}`);
    console.log(`   Станция: ${pdf.station || 'Без станции'}`);
    console.log(`   Длина контента: ${pdf.contentLength} символов`);
    
    if (pdf.hasImages) {
      imageMaterials++;
      console.log(`   ✅ Тип: PDF с изображениями (оставляем)`);
    } else if (pdf.hasIframe || pdf.hasPdfLink) {
      fileMaterials++;
      console.log(`   ✅ Тип: PDF файл для просмотра (оставляем)`);
    } else if (pdf.isTextContent) {
      textMaterials++;
      console.log(`   ❌ Тип: PDF с извлеченным текстом (удаляем)`);
      console.log(`   Превью контента: ${pdf.contentPreview}...`);
    } else {
      console.log(`   ⚠️  Тип: Неопределен`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Статистика:');
  console.log(`   📄 PDF файлы для просмотра: ${fileMaterials}`);
  console.log(`   🖼️  PDF с изображениями: ${imageMaterials}`);
  console.log(`   📝 PDF с извлеченным текстом: ${textMaterials}`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

