import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Финальная организация материалов...\n');

  // Находим материал "Функционал Кликун"
  const allMaterials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  });

  const funcMaterial = allMaterials.find(m => 
    m.title.toLowerCase().includes('функционал')
  );

  if (funcMaterial && funcMaterial.section.station?.name === 'Станция кассы') {
    // Проверяем, есть ли раздел "Функционал системы"
    let funcSection = await prisma.section.findFirst({
      where: {
        title: 'Функционал системы',
        station: {
          name: 'Станция кассы',
        },
      },
    });

    if (!funcSection) {
      const station = await prisma.station.findFirst({
        where: { name: 'Станция кассы' },
      });

      if (station) {
        funcSection = await prisma.section.create({
          data: {
            title: 'Функционал системы',
            description: 'Функционал системы Кликун',
            stationId: station.id,
            order: 3,
          },
        });
        console.log('✅ Создан раздел "Функционал системы"');
      }
    }

    if (funcSection && funcMaterial.sectionId !== funcSection.id) {
      await prisma.material.update({
        where: { id: funcMaterial.id },
        data: {
          sectionId: funcSection.id,
          order: 0,
        },
      });
      console.log(`✅ Перемещен "${funcMaterial.title}" в раздел "Функционал системы"`);
    }
  }

  // Улучшаем названия материалов - убираем лишние символы
  console.log('\n✏️  Улучшаю названия материалов...\n');

  const materials = await prisma.material.findMany();

  for (const material of materials) {
    let newTitle = material.title;

    // Убираем подчеркивания в начале/конце
    newTitle = newTitle.replace(/^_+|_+$/g, '').trim();

    // Заменяем множественные подчеркивания на пробелы
    newTitle = newTitle.replace(/_+/g, ' ').trim();

    // Капитализируем только первую букву всего названия
    // Остальные слова - строчные, кроме аббревиатур
    const words = newTitle.split(' ');
    const firstWord = words[0];
    const restWords = words.slice(1);
    
    // Первое слово - первая буква заглавная
    const capitalizedFirst = firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
    
    // Остальные слова - строчные, кроме аббревиатур
    const capitalizedRest = restWords.map(word => {
      // Проверяем, является ли слово аббревиатурой (все заглавные или содержит цифры)
      if (/^[A-ZА-Я]{2,}$/.test(word) || /^\d+/.test(word)) {
        return word;
      }
      return word.toLowerCase();
    });
    
    newTitle = [capitalizedFirst, ...capitalizedRest].join(' ');

    // Исправляем специальные случаи и аббревиатуры
    newTitle = newTitle
      .replace(/\bL3\b/gi, 'L3')
      .replace(/\bKfc\b/gi, 'KFC')
      .replace(/\bAbr\b/gi, 'ABR')
      .replace(/\bOrs\b/gi, 'ОРС')
      .replace(/\bFd\b/gi, 'FD')
      .replace(/\bБш\b/gi, 'БШ')
      .replace(/\bVer\b/gi, 'ver')
      .replace(/\bДля\b/g, 'для')
      .replace(/\bС\b/g, 'с')
      .replace(/\bИ\b/g, 'и')
      .replace(/\bПо\b/g, 'по')
      .replace(/\bНа\b/g, 'на')
      .replace(/\bВ\b/g, 'в');

    if (newTitle !== material.title && newTitle.length > 0) {
      await prisma.material.update({
        where: { id: material.id },
        data: { title: newTitle },
      });
      console.log(`   ✏️  "${material.title}" → "${newTitle}"`);
    }
  }

  // Упорядочиваем материалы в каждом разделе по алфавиту
  console.log('\n📝 Упорядочиваю материалы по алфавиту...\n');

  const sections = await prisma.section.findMany({
    include: {
      materials: true,
    },
  });

  for (const section of sections) {
    if (section.materials.length === 0) continue;

    const sorted = [...section.materials].sort((a, b) => {
      return a.title.localeCompare(b.title, 'ru');
    });

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].order !== i) {
        await prisma.material.update({
          where: { id: sorted[i].id },
          data: { order: i },
        });
      }
    }

    console.log(`   ✅ Упорядочено ${section.materials.length} материалов в разделе "${section.title}"`);
  }

  // Финальная статистика
  const finalStations = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          materials: {
            orderBy: { order: 'asc' },
          },
          _count: {
            select: { materials: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  console.log('\n✅ Финальная организация завершена!');
  console.log('\n📊 Итоговая структура:\n');

  for (const station of finalStations) {
    const stationMaterials = station.sections.reduce((sum, s) => sum + s._count.materials, 0);
    if (stationMaterials === 0) continue;

    console.log(`📁 ${station.name} (${station.sections.filter(s => s._count.materials > 0).length} разделов, ${stationMaterials} материалов)`);
    for (const section of station.sections) {
      if (section._count.materials > 0) {
        console.log(`   └─ ${section.title} (${section._count.materials} материалов)`);
        for (const material of section.materials) {
          console.log(`      • ${material.title}`);
        }
      }
    }
    console.log('');
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

