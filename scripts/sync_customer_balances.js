const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SYNCING PRISMA DATABASE ---');
  const customers = await prisma.customer.findMany({
    include: { taxInvoices: true },
  });

  for (const c of customers) {
    const validInvoices = c.taxInvoices.filter(i => i.fulfilmentStatus !== 'CANCELLED');
    const totalOrders = validInvoices.length;
    const totalSpent = validInvoices
      .filter(i => i.paymentStatus === 'PAID')
      .reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
    const currentBalance = validInvoices
      .filter(i => i.paymentStatus !== 'PAID')
      .reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);

    console.log(`Updating customer ${c.customerCode} (${c.companyName}):`);
    console.log(`  Before: balance=${c.currentBalance}, orders=${c.totalOrders}, spent=${c.totalSpent}`);
    console.log(`  After:  balance=${currentBalance}, orders=${totalOrders}, spent=${totalSpent}`);

    await prisma.customer.update({
      where: { id: c.id },
      data: {
        currentBalance,
        totalOrders,
        totalSpent,
      },
    });
  }

  console.log('\n--- SYNCING DATA/ERP-STORE.JSON ---');
  const storePath = path.join(__dirname, '..', 'data', 'erp-store.json');
  if (fs.existsSync(storePath)) {
    const raw = fs.readFileSync(storePath, 'utf8');
    const data = JSON.parse(raw);
    const invoices = Array.isArray(data.invoices) ? data.invoices : [];

    if (Array.isArray(data.customers)) {
      for (const cust of data.customers) {
        const custInvoices = invoices.filter(
          i => (i.customerId === cust.id || i.customerId === cust.customerCode) && i.fulfilmentStatus !== 'CANCELLED'
        );
        if (custInvoices.length > 0) {
          cust.totalOrders = custInvoices.length;
          cust.totalSpent = custInvoices
            .filter(i => i.paymentStatus === 'PAID')
            .reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
          cust.currentBalance = custInvoices
            .filter(i => i.paymentStatus !== 'PAID')
            .reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
        } else {
          // If no invoices in dataStore but in Prisma, sync from Prisma values
          const matchingPrisma = customers.find(pc => pc.id === cust.id || pc.customerCode === cust.customerCode);
          if (matchingPrisma) {
            const valid = matchingPrisma.taxInvoices.filter(i => i.fulfilmentStatus !== 'CANCELLED');
            cust.totalOrders = valid.length;
            cust.totalSpent = valid
              .filter(i => i.paymentStatus === 'PAID')
              .reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
            cust.currentBalance = valid
              .filter(i => i.paymentStatus !== 'PAID')
              .reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
          } else {
            cust.currentBalance = Math.max(0, cust.currentBalance || 0);
          }
        }
        console.log(`Synced dataStore customer ${cust.customerCode} (${cust.companyName}): balance=${cust.currentBalance}, orders=${cust.totalOrders}, spent=${cust.totalSpent}`);
      }
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Successfully wrote updated erp-store.json');
    }
  }

  await prisma.$disconnect();
  console.log('\nCustomer balances & orders successfully synchronized!');
}

main().catch(err => {
  console.error('Error syncing:', err);
  process.exit(1);
});
