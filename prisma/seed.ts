import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting clean database seed for ARIB GLOBAL ERP...');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.cloudDocument.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.packingDetails.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.taxInvoice.deleteMany();
  await prisma.proformaItem.deleteMany();
  await prisma.proforma.deleteMany();
  await prisma.stockAdjustment.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.depotInventory.deleteMany();
  await prisma.serialNumber.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.depot.deleteMany();
  await prisma.user.deleteMany();
  await prisma.companySettings.deleteMany();

  console.log('✅ Existing data cleared');

  // Create Company Settings
  console.log('⚙️ Creating company settings...');
  await prisma.companySettings.upsert({
    where: { id: 'global-settings' },
    update: {
      companyName: 'ARIB GLOBAL',
      tradingName: 'ARIB GLOBAL',
      email: 'contact@aribglobal.com',
      website: 'https://aribglobal.com',
    },
    create: {
      id: 'global-settings',
      companyName: 'ARIB GLOBAL',
      tradingName: 'ARIB GLOBAL',
      logoUrl: '/pdflogo.png',
      taxRegistrationNumber: 'VAT-99201-US-GLOBAL',
      vatGstNumber: 'TRN-100889218200001',
      companyAddress: 'Office 402, Business Bay, Dubai, UAE',
      phone: '+971 4 800 0100',
      email: 'contact@aribglobal.com',
      website: 'https://aribglobal.com',
      currency: 'USD',
      currencySymbol: '$',
      bankName: 'Commercial Bank of Dubai, Sheikh Zayed Road Branch, Dubai, U.A.E.',
      accountName: 'Arib Global General Trading LLC',
      accountNumber: 'AE910230000001002416343',
      swiftBic: 'CBOUAEADXXX',
      iban: 'AE91 0230 0000 0100 2416 343',
      routingCode: 'CBD-0230',
      invoicePrefix: 'INV-2026-',
      proformaPrefix: 'PF-2026-',
      invoiceNextNumber: 1,
      proformaNextNumber: 1,
    },
  });
  console.log('✅ Company settings created');

  // Create Single Depot (Current Depot)
  console.log('🏭 Creating single central depot...');
  const centralDepot = await prisma.depot.create({
    data: {
      id: 'dep-central',
      code: 'DEP-CENTRAL',
      name: 'Central Depot',
      address: 'Central Logistics Hub, Warehouse 1',
      city: 'Dubai',
      country: 'United Arab Emirates',
      contactPerson: 'Depot Manager',
      phone: '+971 4 800 0100',
      email: 'depot@aribglobal.com',
      isCentralHub: true,
      activeOrdersCount: 0,
      totalStockUnits: 0,
      totalStockValue: 0,
    },
  });
  console.log(`✅ Created central depot: ${centralDepot.name}`);

  // Create Initial Users with salted password hashes
  console.log('👤 Creating initial system users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'usr-admin',
        name: 'System Administrator',
        email: 'admin@aribglobal.com',
        role: 'SUPER_ADMIN',
        avatar: '',
        phone: '+971 4 800 0100',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('Admin@Arib2026!'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'usr-depot',
        name: 'Depot Manager',
        email: 'depot@aribglobal.com',
        role: 'DEPOT_USER',
        assignedDepotId: 'dep-central',
        assignedDepotName: 'Central Depot',
        avatar: '',
        phone: '+971 4 800 0100',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('Depot@Arib2026!'),
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  console.log('🎉 Clean database seed completed successfully!');
  console.log('📝 ARIB GLOBAL ERP Database initialized.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
