import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Правильное распределение материалов по разделам
const materialPlacements: Record<string, { station: string; section: string }> = {
  // Общие стандарты
  'единый справочник новый': { station: 'Общие стандарты', section: 'Справочники' },
  'единый справочник': { station: 'Общие стандарты', section: 'Справочники' },
  'общие стандарты станций-1': { station: 'Общие стандарты', section: 'Стандарты работы' },
  'l3 presentation': { station: 'Общие стандарты', section: 'Обучение и тренинги' },
  'l3 для мс': { station: 'Общие стандарты', section: 'Обучение и тренинги' },
  'тренинг для тренеров': { station: 'Общие стандарты', section: 'Обучение и тренинги' },
  'easy chek': { station: 'Общие стандарты', section: 'Чек-листы' },
  'карточки abr': { station: 'Общие стандарты', section: 'Карточки' },
  'зп рестораны': { station: 'Общие стандарты', section: 'Зарплата и рестораны' },
  'красочное описание': { station: 'Общие стандарты', section: 'Описания продуктов' },
  'тайгета': { station: 'Общие стандарты', section: 'Химия и дезинфекция' },
  'шпаргалка_для_членов_команды_орс': { station: 'Общие стандарты', section: 'Шпаргалки' },
  'руководство_по_устранению_проблем_с_готовой_курицей': { station: 'Станция кухни', section: 'Устранение проблем' },

  // Станция кассы
  'кликун 2': { station: 'Станция кассы', section: 'Основы работы' },
  'касса-1': { station: 'Станция кассы', section: 'Основы работы' },
  'операционное руководство кликун': { station: 'Станция кассы', section: 'Операционное руководство' },
  'рутина кликуна': { station: 'Станция кассы', section: 'Рутины' },
  'функционал кликун': { station: 'Станция кассы', section: 'Функционал системы' },
  'функционал кликун 2': { station: 'Станция кассы', section: 'Функционал системы' },
  'чек лист кликун': { station: 'Станция кассы', section: 'Чек-листы' },
  'кликун закрытие и передача смены': { station: 'Станция кассы', section: 'Закрытие и передача смены' },

  // Станция кухни
  'введение в работу на кухне': { station: 'Станция кухни', section: 'Основы работы' },
  'работа с кассовым аппаратом': { station: 'Станция кассы', section: 'Основы работы' },
  'руководство бш fd': { station: 'Станция кухни', section: 'Руководства' },
  'справочник по модулю панировка': { station: 'Станция кухни', section: 'Справочники' },
  'параметры приготовления': { station: 'Станция кухни', section: 'Параметры приготовления' },
  'сроки и хранение кухня': { station: 'Станция кухни', section: 'Сроки хранения' },
  'сроки хранения панера': { station: 'Станция кухни', section: 'Сроки хранения' },
  'чек лист панера': { station: 'Станция кухни', section: 'Чек-листы панировки' },
};

async function main() {
  console.log('🔧 Исправляю размещение материалов...\n');

  // Получаем все материалы
  const materials = await prisma.material.findMany({
    include: {
      section: {
        include: {
          station: true,
        },
      },
    },
  });

  let movedCount = 0;

  for (const material of materials) {
    const normalizedTitle = material.title
      .toLowerCase()
      .trim()
      .replace(/\s*\(часть\s+\d+\/\d+\)/gi, '')
      .replace(/\.(pdf|docx|pptx|ppt|xlsx)$/i, '');

    // Ищем правильное размещение
    let correctPlacement = null;
    for (const [key, placement] of Object.entries(materialPlacements)) {
      if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
        correctPlacement = placement;
        break;
      }
    }

    if (!correctPlacement) {
      // Пробуем частичное совпадение
      for (const [key, placement] of Object.entries(materialPlacements)) {
        const keyWords = key.split(/\s+/);
        const titleWords = normalizedTitle.split(/\s+/);
        const matchCount = keyWords.filter(kw => 
          titleWords.some(tw => tw.includes(kw) || kw.includes(tw))
        ).length;
        
        if (matchCount >= Math.min(2, keyWords.length)) {
          correctPlacement = placement;
          break;
        }
      }
    }

    if (correctPlacement) {
      // Проверяем, нужно ли перемещать
      const currentStation = material.section?.station?.name || '';
      const currentSection = material.section?.title || '';

      if (currentStation !== correctPlacement.station || currentSection !== correctPlacement.section) {
        // Находим правильную станцию и раздел
        const targetStation = await prisma.station.findFirst({
          where: { name: correctPlacement.station },
        });

        if (!targetStation) {
          console.log(`⚠️  Станция "${correctPlacement.station}" не найдена для материала "${material.title}"`);
          continue;
        }

        let targetSection = await prisma.section.findFirst({
          where: {
            title: correctPlacement.section,
            stationId: targetStation.id,
          },
        });

        if (!targetSection) {
          // Создаем раздел если его нет
          const existingSections = await prisma.section.findMany({
            where: { stationId: targetStation.id },
          });
          targetSection = await prisma.section.create({
            data: {
              title: correctPlacement.section,
              description: `Раздел: ${correctPlacement.section}`,
              stationId: targetStation.id,
              order: existingSections.length,
            },
          });
          console.log(`   ✅ Создан раздел "${correctPlacement.section}" в станции "${correctPlacement.station}"`);
        }

        // Получаем максимальный порядок в целевом разделе
        const existingMaterials = await prisma.material.findMany({
          where: { sectionId: targetSection.id },
        });
        const maxOrder = existingMaterials.length > 0
          ? Math.max(...existingMaterials.map(m => m.order))
          : -1;

        // Перемещаем материал
        await prisma.material.update({
          where: { id: material.id },
          data: {
            sectionId: targetSection.id,
            order: maxOrder + 1,
          },
        });

        movedCount++;
        console.log(`   ✅ Перемещен: "${material.title}"`);
        console.log(`      ${currentStation} → ${correctPlacement.station}`);
        console.log(`      ${currentSection} → ${correctPlacement.section}`);
      }
    }
  }

  // Удаляем пустые разделы
  console.log('\n🧹 Удаляю пустые разделы...\n');
  
  const emptySections = await prisma.section.findMany({
    include: {
      _count: {
        select: { materials: true },
      },
    },
  });

  let deletedSections = 0;
  for (const section of emptySections) {
    if (section._count.materials === 0) {
      await prisma.section.delete({
        where: { id: section.id },
      });
      deletedSections++;
      console.log(`   ❌ Удален пустой раздел: "${section.title}" (станция: ${section.stationId})`);
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

  console.log('\n✅ Исправление завершено!');
  console.log(`📊 Статистика:`);
  console.log(`   - Перемещено материалов: ${movedCount}`);
  console.log(`   - Удалено пустых разделов: ${deletedSections}`);
  console.log('\n📁 Итоговая структура:\n');

  for (const station of finalStations) {
    const stationMaterials = station.sections.reduce((sum, s) => sum + s._count.materials, 0);
    if (stationMaterials === 0) continue;

    console.log(`📁 ${station.name} (${station.sections.filter(s => s._count.materials > 0).length} разделов, ${stationMaterials} материалов)`);
    for (const section of station.sections) {
      if (section._count.materials > 0) {
        console.log(`   └─ ${section.title} (${section._count.materials} материалов)`);
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

