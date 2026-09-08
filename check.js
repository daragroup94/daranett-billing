const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating GRACE_PERIOD to ACTIVE...');
  const updated = await prisma.customer.updateMany({
    where: { status: 'GRACE_PERIOD' },
    data: { status: 'ACTIVE' }
  });
  console.log(`Updated ${updated.count} customers.`);

  console.log('\nChecking customers...');
  const customers = await prisma.customer.findMany({
    include: { invoices: true }
  });
  
  for (const c of customers) {
    let overdueCount = 0;
    for (const inv of c.invoices) {
      if (inv.status === 'UNPAID') {
        overdueCount++;
        const amt = inv.amount - (inv.discount || 0);
        console.log(`- ${c.name} [Status: ${c.status}]: Unpaid Invoice ${inv.month}, Amount: ${amt}, Due Date: ${c.dueDate}`);
      }
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
