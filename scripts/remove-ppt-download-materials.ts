import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Удаляю старые материалы PPT/PPTX с кнопками скачивания...\n');
  
  // Находим материалы, которые содержат кнопки скачивания PowerPoint
  const materials = await prisma.material.findMany({
    where: {
      OR: [
        { content: { contains: 'Скачать PowerPoint презентацию' } },
        { content: { contains: 'Скачать PowerPoint' } },
        { content: { contains: 'Открыть в новом окне' } },
      ],
    },
  });
  
  console.log(`Найдено ${materials.length} материалов с кнопками скачивания PowerPoint\n`);
  
  for (const material of materials) {
    // Проверяем, что это действительно PowerPoint материал (не PDF)
    if (material.content.includes('PowerPoint') && !material.content.includes('PDF')) {
      console.log(`Удаляю: ${material.title}`);
      await prisma.material.delete({
        where: { id: material.id },
      });
    }
  }
  
  console.log(`\n✅ Удаление завершено!`);
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

