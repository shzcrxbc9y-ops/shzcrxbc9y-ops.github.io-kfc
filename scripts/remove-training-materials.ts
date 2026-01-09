import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Удаляю все материалы из раздела "Обучение и тренинги"...\n');
  
  // Получаем все разделы и ищем нужный (для SQLite)
  const allSections = await prisma.section.findMany({
    include: {
      materials: true,
    },
  });
  
  // Ищем раздел, который содержит "Обучение" или "тренинг"
  const section = allSections.find(s => {
    const title = s.title.toLowerCase();
    return title.includes('обучение') || title.includes('тренинг');
  });
  
  if (!section) {
    console.log('❌ Раздел "Обучение и тренинги" не найден!');
    console.log('\nДоступные разделы:');
    allSections.forEach(s => {
      console.log(`  - ${s.title} (${s.materials.length} материалов)`);
    });
    return;
  }
  
  console.log(`Найден раздел: "${section.title}"`);
  console.log(`Найдено материалов: ${section.materials.length}\n`);
  
  if (section.materials.length === 0) {
    console.log('✅ В разделе нет материалов для удаления.');
    return;
  }
  
  // Удаляем все материалы из раздела
  for (const material of section.materials) {
    console.log(`Удаляю: ${material.title}`);
    await prisma.material.delete({
      where: { id: material.id },
    });
  }
  
  console.log(`\n✅ Удалено ${section.materials.length} материалов из раздела "${section.title}"`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

