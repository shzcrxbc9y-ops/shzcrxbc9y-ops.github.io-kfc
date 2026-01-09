import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Начинаю полную очистку всех дубликатов...\n');

  // Получаем все материалы с разделами и станциями
  const allMaterials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`📚 Всего материалов в базе: ${allMaterials.length}\n`);

  // Группируем материалы по нормализованному названию
  const materialsByTitle = new Map<string, any[]>();

  for (const material of allMaterials) {
    // Нормализуем название: убираем расширения, части, лишние символы
    let normalizedTitle = material.title
      .replace(/\s*\(часть\s+\d+\/\d+\)/gi, '') // Убираем "(часть 1/2)"
      .replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '') // Убираем расширения
      .replace(/\s+/g, ' ') // Убираем лишние пробелы
      .replace(/[_\-\s]+/g, ' ') // Заменяем подчеркивания и дефисы на пробелы
      .trim()
      .toLowerCase();

    // Убираем лишние пробелы в конце и начале
    normalizedTitle = normalizedTitle.replace(/^\s+|\s+$/g, '');

    if (!normalizedTitle || normalizedTitle.length === 0) {
      // Пропускаем материалы с пустыми названиями
      continue;
    }

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

  console.log(`🔍 Найдено групп с дубликатами: ${duplicates.length}\n`);

  if (duplicates.length === 0) {
    console.log('✅ Дубликатов не найдено!');
    return;
  }

  // Удаляем дубликаты, оставляя только самый первый (самый старый)
  let totalDeleted = 0;
  let totalGroups = 0;

  for (const dup of duplicates) {
    totalGroups++;
    console.log(`\n📋 Группа ${totalGroups}: "${dup.title}"`);
    console.log(`   Найдено копий: ${dup.materials.length}`);

    // Сортируем по дате создания (самый старый первый)
    const sorted = dup.materials.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Оставляем первый, удаляем остальные
    const toKeep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`   ✅ Оставляем: "${toKeep.title}"`);
    console.log(`      Раздел: ${toKeep.section?.title || 'Без раздела'}`);
    console.log(`      Станция: ${toKeep.section?.station?.name || 'Без станции'}`);
    console.log(`      ID: ${toKeep.id}`);
    console.log(`      Создан: ${toKeep.createdAt.toISOString()}`);

    for (const material of toDelete) {
      try {
        await prisma.material.delete({
          where: { id: material.id },
        });
        totalDeleted++;
        console.log(`   ❌ Удален: "${material.title}" (ID: ${material.id})`);
      } catch (error: any) {
        console.error(`   ⚠️  Ошибка при удалении "${material.title}": ${error.message}`);
      }
    }
  }

  // Финальная статистика
  const finalCount = await prisma.material.count();
  console.log(`\n\n✅ Очистка завершена!`);
  console.log(`📊 Итоговая статистика:`);
  console.log(`   - Было материалов: ${allMaterials.length}`);
  console.log(`   - Найдено групп с дубликатами: ${totalGroups}`);
  console.log(`   - Удалено дубликатов: ${totalDeleted}`);
  console.log(`   - Осталось материалов: ${finalCount}`);
  console.log(`   - Экономия: ${totalDeleted} материалов удалено`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

