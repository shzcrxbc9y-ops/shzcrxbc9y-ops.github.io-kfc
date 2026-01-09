import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Начинаю очистку дубликатов в разделах обучения...\n');

  // Находим все разделы, связанные с обучением
  // SQLite не поддерживает mode: 'insensitive', поэтому используем OR с разными вариантами
  const allSections = await prisma.section.findMany({
    include: {
      station: true,
      materials: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  // Фильтруем разделы, связанные с обучением (без учета регистра)
  const trainingSections = allSections.filter(section => {
    const titleLower = section.title.toLowerCase();
    return titleLower.includes('обучение') || 
           titleLower.includes('тренинг') || 
           titleLower.includes('тренер') ||
           titleLower.includes('l3');
  });

  console.log(`📚 Найдено разделов обучения: ${trainingSections.length}\n`);

  let totalDeleted = 0;

  for (const section of trainingSections) {
    console.log(`\n📂 Раздел: "${section.title}" (станция: ${section.station?.name || 'Без станции'})`);
    console.log(`   Материалов: ${section.materials.length}`);

    if (section.materials.length === 0) {
      console.log('   ⏭️  Пропускаем (нет материалов)');
      continue;
    }

    // Группируем материалы по нормализованному названию
    const materialsByTitle = new Map<string, any[]>();

    for (const material of section.materials) {
      // Нормализуем название: убираем расширения, части, лишние символы
      const normalizedTitle = material.title
        .replace(/\s*\(часть\s+\d+\/\d+\)/gi, '') // Убираем "(часть 1/2)"
        .replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '') // Убираем расширения
        .replace(/\s+/g, ' ') // Убираем лишние пробелы
        .trim()
        .toLowerCase();

      if (!materialsByTitle.has(normalizedTitle)) {
        materialsByTitle.set(normalizedTitle, []);
      }
      materialsByTitle.get(normalizedTitle)!.push(material);
    }

    // Находим дубликаты
    const duplicates: { title: string; materials: any[] }[] = [];
    for (const [title, mats] of materialsByTitle.entries()) {
      if (mats.length > 1) {
        duplicates.push({ title, materials: mats });
      }
    }

    if (duplicates.length === 0) {
      console.log('   ✅ Дубликатов не найдено');
      continue;
    }

    console.log(`   🔍 Найдено дубликатов: ${duplicates.length}`);

    // Удаляем дубликаты, оставляя только самый первый (самый старый)
    let deletedCount = 0;
    for (const dup of duplicates) {
      console.log(`\n   📋 Дубликаты для: "${dup.title}"`);
      console.log(`      Найдено копий: ${dup.materials.length}`);

      // Сортируем по дате создания (самый старый первый)
      const sorted = dup.materials.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      );

      // Оставляем первый, удаляем остальные
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`      ✅ Оставляем: "${toKeep.title}" (ID: ${toKeep.id})`);

      for (const material of toDelete) {
        await prisma.material.delete({
          where: { id: material.id },
        });
        deletedCount++;
        totalDeleted++;
        console.log(`      ❌ Удален: "${material.title}" (ID: ${material.id})`);
      }
    }

    console.log(`\n   ✅ В разделе "${section.title}" удалено: ${deletedCount} дубликатов`);
  }

  console.log(`\n\n✅ Очистка завершена!`);
  console.log(`📊 Итоговая статистика:`);
  console.log(`   - Проверено разделов: ${trainingSections.length}`);
  console.log(`   - Удалено дубликатов: ${totalDeleted}`);

  // Показываем финальную статистику по разделам
  console.log(`\n📚 Финальное состояние разделов обучения:`);
  for (const section of trainingSections) {
    const finalCount = await prisma.material.count({
      where: { sectionId: section.id },
    });
    console.log(`   - "${section.title}": ${finalCount} материалов`);
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

