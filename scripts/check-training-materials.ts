import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ищу материалы, связанные с обучением...\n');
  
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
  
  console.log(`Всего материалов: ${allMaterials.length}\n`);
  
  // Ищем материалы, которые могут быть связаны с обучением
  const trainingKeywords = ['l3', 'тренинг', 'тренер', 'обучение', 'presentation', 'презентация'];
  
  const trainingMaterials = allMaterials.filter(m => {
    const title = m.title.toLowerCase();
    return trainingKeywords.some(keyword => title.includes(keyword));
  });
  
  if (trainingMaterials.length > 0) {
    console.log(`Найдено материалов, связанных с обучением: ${trainingMaterials.length}\n`);
    
    for (const material of trainingMaterials) {
      console.log(`📄 ${material.title}`);
      console.log(`   Раздел: "${material.section?.title ?? 'Нет раздела'}"`);
      console.log(`   Станция: ${material.section?.station?.name ?? 'Нет станции'}`);
      console.log('');
    }
  } else {
    console.log('❌ Материалы, связанные с обучением, не найдены!\n');
  }
  
  // Проверяем разделы "000" и "00"
  const strangeSections = await prisma.section.findMany({
    where: {
      OR: [
        { title: '000' },
        { title: '00' },
      ],
    },
    include: {
      materials: true,
      station: true,
    },
  });
  
  if (strangeSections.length > 0) {
    console.log('\nРазделы "000" и "00":');
    for (const section of strangeSections) {
      console.log(`\n📁 Раздел: "${section.title}"`);
      console.log(`   Станция: ${section.station?.name ?? 'Нет станции'}`);
      console.log(`   Материалов: ${section.materials.length}`);
      if (section.materials.length > 0) {
        console.log(`   Материалы:`);
        section.materials.forEach(m => {
          console.log(`     - ${m.title}`);
        });
      }
    }
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

