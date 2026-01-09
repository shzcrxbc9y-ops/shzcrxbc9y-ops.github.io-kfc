import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Начинаю очистку и упорядочивание материалов...\n');

  // Получаем все материалы с разделами и станциями
  const materials = await prisma.material.findMany({
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

  console.log(`Найдено материалов: ${materials.length}\n`);

  // Группируем материалы по названию (без расширений и частей)
  const materialsByTitle = new Map<string, any[]>();

  for (const material of materials) {
    // Нормализуем название: убираем расширения, части, лишние символы
    const normalizedTitle = material.title
      .replace(/\s*\(часть\s+\d+\/\d+\)/gi, '') // Убираем "(часть 1/2)"
      .replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '') // Убираем расширения
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

  console.log(`📋 Найдено дубликатов: ${duplicates.length}\n`);

  // Удаляем дубликаты, оставляя только самый первый (самый старый)
  let deletedCount = 0;
  for (const dup of duplicates) {
    console.log(`\n🔍 Дубликаты для: "${dup.title}"`);
    console.log(`   Найдено копий: ${dup.materials.length}`);

    // Сортируем по дате создания (самый старый первый)
    const sorted = dup.materials.sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Оставляем первый, удаляем остальные
    const toKeep = sorted[0];
    const toDelete = sorted.slice(1);

    console.log(`   ✅ Оставляем: ID ${toKeep.id} (создан: ${toKeep.createdAt.toISOString()})`);

    for (const material of toDelete) {
      await prisma.material.delete({
        where: { id: material.id },
      });
      deletedCount++;
      console.log(`   ❌ Удален: ID ${material.id}`);
    }
  }

  console.log(`\n✅ Удалено дубликатов: ${deletedCount}\n`);

  // Теперь упорядочиваем оставшиеся материалы
  console.log('📝 Упорядочиваю материалы по разделам...\n');

  // Получаем все разделы с их станциями
  const sections = await prisma.section.findMany({
    include: {
      station: true,
      materials: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: [
      { station: { order: 'asc' } },
      { order: 'asc' },
    ],
  });

  // Пересчитываем порядок для каждого раздела
  for (const section of sections) {
    if (section.materials.length === 0) continue;

    console.log(`📂 ${section.station?.name || 'Без станции'} → ${section.title}: ${section.materials.length} материалов`);

    // Сортируем материалы по названию для логичного порядка
    const sortedMaterials = [...section.materials].sort((a, b) => {
      // Сначала материалы с понятными названиями
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      return titleA.localeCompare(titleB, 'ru');
    });

    // Обновляем порядок
    for (let i = 0; i < sortedMaterials.length; i++) {
      if (sortedMaterials[i].order !== i) {
        await prisma.material.update({
          where: { id: sortedMaterials[i].id },
          data: { order: i },
        });
      }
    }
  }

  // Улучшаем названия материалов (убираем лишнее)
  console.log('\n✏️  Улучшаю названия материалов...\n');

  const allMaterials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  });

  for (const material of allMaterials) {
    let newTitle = material.title;

    // Убираем "(часть X/Y)" если есть
    newTitle = newTitle.replace(/\s*\(часть\s+\d+\/\d+\)/gi, '').trim();

    // Убираем расширения файлов
    newTitle = newTitle.replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '').trim();

    // Улучшаем названия для PDF/PPT файлов
    if (material.content.includes('[PDF_FILE]') || material.content.includes('PDF документ')) {
      // Название уже должно быть без расширения
    }

    // Капитализируем первую букву
    if (newTitle.length > 0) {
      newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1);
    }

    // Обновляем только если название изменилось
    if (newTitle !== material.title && newTitle.length > 0) {
      await prisma.material.update({
        where: { id: material.id },
        data: { title: newTitle },
      });
      console.log(`   ✏️  "${material.title}" → "${newTitle}"`);
    }
  }

  // Финальная статистика
  const finalCount = await prisma.material.count();
  console.log(`\n✅ Очистка завершена!`);
  console.log(`📊 Итоговая статистика:`);
  console.log(`   - Удалено дубликатов: ${deletedCount}`);
  console.log(`   - Осталось материалов: ${finalCount}`);
  console.log(`   - Разделов: ${sections.length}`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

