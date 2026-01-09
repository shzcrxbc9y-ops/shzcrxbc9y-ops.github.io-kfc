import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Упорядочиваю разделы и материалы...\n');

  // Получаем все станции с разделами
  const stations = await prisma.station.findMany({
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

  // Объединяем дублирующиеся разделы
  console.log('🔍 Проверяю дублирующиеся разделы...\n');

  for (const station of stations) {
    const sectionMap = new Map<string, any[]>();

    // Группируем разделы по названию
    for (const section of station.sections) {
      const key = section.title.toLowerCase().trim();
      if (!sectionMap.has(key)) {
        sectionMap.set(key, []);
      }
      sectionMap.get(key)!.push(section);
    }

    // Объединяем дубликаты разделов
    for (const [key, sections] of sectionMap.entries()) {
      if (sections.length > 1) {
        console.log(`📂 Станция "${station.name}": найдено ${sections.length} разделов "${sections[0].title}"`);
        
        // Оставляем первый раздел, переносим материалы из остальных
        const mainSection = sections[0];
        const duplicateSections = sections.slice(1);

        for (const dupSection of duplicateSections) {
          // Переносим материалы
          const materials = await prisma.material.findMany({
            where: { sectionId: dupSection.id },
          });

          let maxOrder = mainSection.materials.length > 0
            ? Math.max(...mainSection.materials.map(m => m.order))
            : -1;

          for (const material of materials) {
            await prisma.material.update({
              where: { id: material.id },
              data: {
                sectionId: mainSection.id,
                order: ++maxOrder,
              },
            });
          }

          // Удаляем дублирующийся раздел
          await prisma.section.delete({
            where: { id: dupSection.id },
          });

          console.log(`   ✅ Объединен раздел "${dupSection.title}" (${materials.length} материалов перенесено)`);
        }
      }
    }
  }

  // Упорядочиваем разделы по логичному порядку
  console.log('\n📝 Упорядочиваю разделы...\n');

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

    console.log(`✅ Упорядочены разделы станции "${station.name}"`);
  }

  // Улучшаем названия разделов
  console.log('\n✏️  Улучшаю названия разделов...\n');

  const sectionRenames: Record<string, string> = {
    'Корпоративная культура': 'Стандарты работы',
    'Работа с кассой': 'Основы работы',
    'Основы работы на кухне': 'Основы работы',
  };

  for (const [oldName, newName] of Object.entries(sectionRenames)) {
    const sections = await prisma.section.findMany({
      where: { title: oldName },
    });

    for (const section of sections) {
      // Проверяем, нет ли уже раздела с таким названием в той же станции
      const existing = await prisma.section.findFirst({
        where: {
          title: newName,
          stationId: section.stationId,
        },
      });

      if (existing) {
        // Объединяем разделы
        const materials = await prisma.material.findMany({
          where: { sectionId: section.id },
        });

        let maxOrder = existing.materials?.length > 0
          ? Math.max(...existing.materials.map((m: any) => m.order))
          : -1;

        for (const material of materials) {
          await prisma.material.update({
            where: { id: material.id },
            data: {
              sectionId: existing.id,
              order: ++maxOrder,
            },
          });
        }

        await prisma.section.delete({
          where: { id: section.id },
        });

        console.log(`   ✅ Объединен раздел "${oldName}" → "${newName}" (${materials.length} материалов)`);
      } else {
        await prisma.section.update({
          where: { id: section.id },
          data: { title: newName },
        });
        console.log(`   ✏️  "${oldName}" → "${newName}"`);
      }
    }
  }

  // Финальная статистика
  const finalStations = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          _count: {
            select: { materials: true },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  console.log('\n✅ Организация завершена!');
  console.log('\n📊 Итоговая структура:\n');

  for (const station of finalStations) {
    console.log(`📁 ${station.name} (${station.sections.length} разделов)`);
    for (const section of station.sections) {
      console.log(`   └─ ${section.title} (${section._count.materials} материалов)`);
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

