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
        name: 'Lite',
        speedUpload: 5,
        speedDownload: 5,
        price: 100000,
        description: 'Cukup untuk browsing & chat harian'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Basic',
        speedUpload: 10,
        speedDownload: 10,
        price: 125000,
        description: 'Standar nyaman untuk kerja & belajar'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Plus',
        speedUpload: 15,
        speedDownload: 15,
        price: 150000,
        description: 'Lebih lega untuk streaming & video call'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Pro',
        speedUpload: 25,
        speedDownload: 25,
        price: 200000,
        description: 'Andalan untuk kerja dan hiburan keluarga'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Prime',
        speedUpload: 35,
        speedDownload: 35,
        price: 250000,
        description: 'Performa unggul, multi-device lancar'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Ultra',
        speedUpload: 50,
        speedDownload: 50,
        price: 400000,
        description: 'Kecepatan tinggi untuk kebutuhan berat'
      }
    });

    await prisma.package.create({
      data: {
        name: 'Max',
        speedUpload: 100,
        speedDownload: 100,
        price: 500000,
        description: 'Kecepatan maksimal, tanpa kompromi'
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
