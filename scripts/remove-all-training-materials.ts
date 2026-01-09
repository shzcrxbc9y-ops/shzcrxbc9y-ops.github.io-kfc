import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Удаляю все материалы из раздела "Обучение и тренинги"...\n');
  
  // Сначала ищем раздел "Обучение и тренинги"
  const allSections = await prisma.section.findMany({
    include: {
      materials: true,
      station: true,
    },
  });
  
  // Ищем раздел, который содержит "Обучение" или "тренинг"
  const trainingSection = allSections.find(s => {
    const title = s.title.toLowerCase();
    return title.includes('обучение') || title.includes('тренинг');
  });
  
  if (trainingSection) {
    console.log(`Найден раздел: "${trainingSection.title}"`);
    console.log(`Станция: ${trainingSection.station?.name ?? 'Нет станции'}`);
    console.log(`Материалов в разделе: ${trainingSection.materials.length}\n`);
    
    if (trainingSection.materials.length === 0) {
      console.log('✅ В разделе нет материалов для удаления.');
      return;
    }
    
    // Удаляем все материалы из раздела
    for (const material of trainingSection.materials) {
      console.log(`Удаляю: ${material.title}`);
      await prisma.material.delete({
        where: { id: material.id },
      });
    }
    
    console.log(`\n✅ Удалено ${trainingSection.materials.length} материалов из раздела "${trainingSection.title}"`);
    return;
  }
  
  // Если раздел не найден, ищем материалы по ключевым словам
  console.log('Раздел "Обучение и тренинги" не найден. Ищу материалы по ключевым словам...\n');
  
  const allMaterials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  });
  
  console.log(`Всего материалов в базе: ${allMaterials.length}\n`);
  
  // Ключевые слова для поиска материалов обучения
  const trainingKeywords = [
    'l3',
    'тренинг',
    'тренер',
    'обучение',
    'presentation',
    'презентация',
    'training',
  ];
  
  // Ищем материалы, связанные с обучением
  const trainingMaterials = allMaterials.filter(m => {
    const title = m.title.toLowerCase();
    const content = (m.content || '').toLowerCase();
    
    return trainingKeywords.some(keyword => 
      title.includes(keyword) || content.includes(keyword)
    );
  });
  
  if (trainingMaterials.length === 0) {
    console.log('❌ Материалы, связанные с обучением, не найдены!');
    
    // Показываем все материалы для справки
    if (allMaterials.length > 0) {
      console.log('\nВсе материалы в базе:');
      allMaterials.forEach(m => {
        console.log(`  - ${m.title} (раздел: "${m.section?.title ?? 'Нет раздела'}")`);
      });
    }
    return;
  }
  
  console.log(`Найдено материалов для удаления: ${trainingMaterials.length}\n`);
  
  // Удаляем материалы
  for (const material of trainingMaterials) {
    console.log(`Удаляю: ${material.title}`);
    console.log(`   Раздел: "${material.section?.title ?? 'Нет раздела'}"`);
    console.log(`   Станция: ${material.section?.station?.name ?? 'Нет станции'}`);
    
    await prisma.material.delete({
      where: { id: material.id },
    });
  }
  
  console.log(`\n✅ Удалено ${trainingMaterials.length} материалов, связанных с обучением`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

