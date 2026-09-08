const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Menghapus data mock dari database...');

  // Hapus semua data (urutan penting karena ada relasi foreign key)
  const deletedInvoices = await prisma.invoice.deleteMany({});
  console.log(`- ${deletedInvoices.count} Invoices dihapus.`);

  const deletedCustomers = await prisma.customer.deleteMany({});
  console.log(`- ${deletedCustomers.count} Customers dihapus.`);

  const deletedLogs = await prisma.systemLog.deleteMany({});
  console.log(`- ${deletedLogs.count} System Logs dihapus.`);

  const deletedPackages = await prisma.package.deleteMany({});
  console.log(`- ${deletedPackages.count} Packages dihapus.`);

  console.log('Semua data mock berhasil dihapus! Database sekarang bersih.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
