import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Получаю все разделы...\n');
  
  // Получаем все разделы
  const allSections = await prisma.section.findMany({
    include: {
      materials: true,
      station: true,
    },
  });
  
  console.log(`Всего разделов: ${allSections.length}\n`);
  
  // Фильтруем разделы, которые содержат "Обучение" или "тренинг"
  const trainingSections = allSections.filter(s => {
    const title = s.title.toLowerCase();
    return title.includes('обучение') || title.includes('тренинг');
  });
  
  if (trainingSections.length > 0) {
    console.log(`Найдено разделов с "Обучение" или "тренинг": ${trainingSections.length}\n`);
    
    for (const section of trainingSections) {
      console.log(`📁 Раздел: "${section.title}"`);
      console.log(`   Станция: ${section.station?.name ?? 'Нет станции'}`);
      console.log(`   Материалов: ${section.materials.length}`);
      if (section.materials.length > 0) {
        console.log(`   Материалы:`);
        section.materials.forEach(m => {
          console.log(`     - ${m.title}`);
        });
      }
      console.log('');
    }
  } else {
    console.log('❌ Разделы с "Обучение" или "тренинг" не найдены!\n');
    console.log('Все разделы:');
    allSections.forEach(s => {
      console.log(`  - "${s.title}" (станция: ${s.station?.name ?? 'Нет станции'}, материалов: ${s.materials.length})`);
    });
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

