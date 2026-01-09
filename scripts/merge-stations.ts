import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Объединяю дублирующиеся станции...\n');

  // Объединяем станции
  const stationMerges = [
    { from: 'Касса', to: 'Станция кассы' },
    { from: 'Кухня', to: 'Станция кухни' },
    { from: 'Панировка', to: 'Станция кухни' },
  ];

  for (const merge of stationMerges) {
    const fromStation = await prisma.station.findFirst({
      where: { name: merge.from },
      include: {
        sections: {
          include: {
            materials: true,
          },
        },
      },
    });

    const toStation = await prisma.station.findFirst({
      where: { name: merge.to },
      include: {
        sections: true,
      },
    });

    if (!fromStation) {
      console.log(`ℹ️  Станция "${merge.from}" не найдена, пропускаю`);
      continue;
    }

    if (!toStation) {
      // Если целевая станция не существует, переименовываем
      await prisma.station.update({
        where: { id: fromStation.id },
        data: { name: merge.to },
      });
      console.log(`✅ Переименована станция "${merge.from}" → "${merge.to}"`);
      continue;
    }

    console.log(`\n🔄 Объединяю "${merge.from}" → "${merge.to}"`);

    // Объединяем разделы
    for (const fromSection of fromStation.sections) {
      // Ищем раздел с таким же названием в целевой станции
      let toSection = await prisma.section.findFirst({
        where: {
          title: fromSection.title,
          stationId: toStation.id,
        },
      });

      if (!toSection) {
        // Создаем раздел в целевой станции
        toSection = await prisma.section.create({
          data: {
            title: fromSection.title,
            description: fromSection.description,
            stationId: toStation.id,
            order: toStation.sections.length,
          },
        });
        console.log(`   ✅ Создан раздел "${fromSection.title}"`);
      }

      // Переносим материалы
      const materials = await prisma.material.findMany({
        where: { sectionId: fromSection.id },
      });

      let maxOrder = 0;
      const existingMaterials = await prisma.material.findMany({
        where: { sectionId: toSection.id },
      });
      if (existingMaterials.length > 0) {
        maxOrder = Math.max(...existingMaterials.map(m => m.order));
      }

      for (const material of materials) {
        await prisma.material.update({
          where: { id: material.id },
          data: {
            sectionId: toSection.id,
            order: ++maxOrder,
          },
        });
      }

      console.log(`   ✅ Перенесено ${materials.length} материалов из раздела "${fromSection.title}"`);

      // Удаляем старый раздел
      await prisma.section.delete({
        where: { id: fromSection.id },
      });
    }

    // Удаляем старую станцию
    await prisma.station.delete({
      where: { id: fromStation.id },
    });

    console.log(`   ✅ Станция "${merge.from}" удалена`);
  }

  // Упорядочиваем разделы в объединенных станциях
  console.log('\n📝 Упорядочиваю разделы...\n');

  const stations = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          _count: {
            select: { materials: true },
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  });

  const sectionOrder: Record<string, string[]> = {
    'Общие стандарты': [
      'Стандарты работы',
      'Справочники',
      'Обучение и тренинги',
      'Чек-листы',
      'Карточки',
      'Зарплата и рестораны',
      'Описания продуктов',
      'Химия и дезинфекция',
      'Сроки хранения',
      'Шпаргалки',
      'Дополнительные материалы',
    ],
    'Станция кассы': [
      'Основы работы',
      'Операционное руководство',
      'Рутины',
      'Функционал системы',
      'Чек-листы',
      'Закрытие и передача смены',
    ],
    'Станция кухни': [
      'Основы работы',
      'Руководства',
      'Справочники',
      'Параметры приготовления',
      'Сроки хранения',
      'Чек-листы панировки',
      'Панировка',
      'Устранение проблем',
    ],
  };

  for (const station of stations) {
    const orderList = sectionOrder[station.name] || [];
    const sectionsMap = new Map(station.sections.map(s => [s.id, s]));
    let orderIndex = 0;

    // Сначала упорядочиваем разделы из списка
    for (const sectionName of orderList) {
      const section = station.sections.find(s => 
        s.title.toLowerCase() === sectionName.toLowerCase()
      );
      if (section && section.order !== orderIndex) {
        await prisma.section.update({
          where: { id: section.id },
          data: { order: orderIndex },
        });
        orderIndex++;
      }
    }

    // Затем остальные разделы
    for (const section of station.sections) {
      if (!orderList.some(name => name.toLowerCase() === section.title.toLowerCase())) {
        if (section.order !== orderIndex) {
          await prisma.section.update({
            where: { id: section.id },
            data: { order: orderIndex },
          });
        }
        orderIndex++;
      }
    }
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

  console.log('\n✅ Объединение завершено!');
  console.log('\n📊 Итоговая структура:\n');

  let totalMaterials = 0;
  for (const station of finalStations) {
    const stationMaterials = station.sections.reduce((sum, s) => sum + s._count.materials, 0);
    totalMaterials += stationMaterials;
    
    console.log(`📁 ${station.name} (${station.sections.length} разделов, ${stationMaterials} материалов)`);
    for (const section of station.sections) {
      if (section._count.materials > 0) {
        console.log(`   └─ ${section.title} (${section._count.materials} материалов)`);
        // Показываем первые 3 материала
        const materials = section.materials.slice(0, 3);
        for (const material of materials) {
          console.log(`      • ${material.title}`);
        }
        if (section._count.materials > 3) {
          console.log(`      ... и еще ${section._count.materials - 3}`);
        }
      }
    }
    console.log('');
  }

  console.log(`\n📊 Всего: ${finalStations.length} станций, ${totalMaterials} материалов`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

