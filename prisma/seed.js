const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process (Ensuring packages exist)...');

  // Check if packages already exist, otherwise create them
  const pkgCount = await prisma.package.count();
  if (pkgCount === 0) {
    console.log('No internet packages found. Creating default packages...');
    
    await prisma.package.create({
      data: {
        name: 'Dara Hemat 10 Mbps',
        speedUpload: 5,
        speedDownload: 10,
        price: 150000,
        description: 'Paket hemat bulanan cocok untuk keluarga kecil 2-3 orang'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Dara Populer 20 Mbps',
        speedUpload: 10,
        speedDownload: 20,
        price: 220000,
        description: 'Paket favorit kecepatan tinggi untuk streaming HD dan game online'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Dara Ultimate 50 Mbps',
        speedUpload: 20,
        speedDownload: 50,
        price: 350000,
        description: 'Paket super kencang tanpa kompromi untuk keluarga besar & SOHO'
      }
    });

    console.log('Default packages created.');
  } else {
    console.log('Internet packages already exist. Skipping package seeding.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
