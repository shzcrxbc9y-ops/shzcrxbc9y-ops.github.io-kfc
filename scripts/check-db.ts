import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const materials = await prisma.material.count();
  const stations = await prisma.station.count();
  const sections = await prisma.section.count();
  
  console.log('\n📊 Статистика базы данных:');
  console.log(`   - Станций: ${stations}`);
  console.log(`   - Разделов: ${sections}`);
  console.log(`   - Материалов: ${materials}\n`);
  
  const stationsList = await prisma.station.findMany({
    include: {
      sections: {
        include: {
          _count: {
            select: { materials: true }
          }
        }
      }
    }
  });
  
  console.log('📁 Структура:');
  for (const station of stationsList) {
    console.log(`\n   Станция: ${station.name}`);
    for (const section of station.sections) {
      console.log(`      - ${section.title}: ${section._count.materials} материалов`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

