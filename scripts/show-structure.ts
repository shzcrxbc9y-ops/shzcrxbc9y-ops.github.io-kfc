import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Итоговая структура материалов на сайте:\n');

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

  let totalMaterials = 0;

  for (const station of stations) {
    const stationMaterials = station.sections.reduce((sum, s) => sum + s._count.materials, 0);
    totalMaterials += stationMaterials;

    if (stationMaterials === 0) continue;

    console.log(`\n📁 ${station.name}`);
    console.log(`   ${station.sections.filter(s => s._count.materials > 0).length} разделов, ${stationMaterials} материалов\n`);

    for (const section of station.sections) {
      if (section._count.materials === 0) continue;

      console.log(`   📂 ${section.title} (${section._count.materials} материалов)`);
      for (const material of section.materials) {
        console.log(`      • ${material.title}`);
      }
      console.log('');
    }
  }

  console.log(`\n📊 Итого: ${stations.length} станций, ${totalMaterials} материалов`);
  console.log(`\n✅ Все материалы упорядочены и готовы к использованию!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

