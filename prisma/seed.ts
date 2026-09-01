import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting clean database seed for client handover...');

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
    update: {},
    create: {
      id: 'global-settings',
      companyName: 'GROWTH BRIDGE',
      tradingName: 'Growth Bridge',
      logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200',
      taxRegistrationNumber: 'VAT-99201-US-GLOBAL',
      vatGstNumber: 'TRN-100889218200001',
      companyAddress: 'Office 402, Business Bay, Dubai, UAE',
      phone: '+91 62827 59863',
      email: 'contact@growthbridge.com',
      website: 'https://growthbridge.com',
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

  // Create Depots (required for product imports with stock)
  console.log('🏭 Creating depots...');
  const depots = await Promise.all([
    prisma.depot.create({
      data: {
        id: 'dep-blr',
        code: 'DEP-BLR',
        name: 'Bangalore Central Depot',
        address: 'Whitefield Main Road, Bangalore, Karnataka 560066',
        city: 'Bangalore',
        country: 'India',
        contactPerson: 'Arun Kumar',
        phone: '+91 80 2839 1100',
        email: 'bangalore@lenscore.com',
        isCentralHub: true,
        activeOrdersCount: 0,
        totalStockUnits: 0,
        totalStockValue: 0,
      },
    }),
    prisma.depot.create({
      data: {
        id: 'dep-dxb',
        code: 'DEP-DXB',
        name: 'Dubai Logistics Hub',
        address: 'Jebel Ali Free Zone, Dubai, UAE',
        city: 'Dubai',
        country: 'United Arab Emirates',
        contactPerson: 'Tariq Al-Mansoor',
        phone: '+971 4 881 2299',
        email: 'dubai@lenscore.com',
        isCentralHub: false,
        activeOrdersCount: 0,
        totalStockUnits: 0,
        totalStockValue: 0,
      },
    }),
    prisma.depot.create({
      data: {
        id: 'dep-bom',
        code: 'DEP-BOM',
        name: 'Mumbai Marine Depot',
        address: 'Andheri East, Mumbai, Maharashtra 400069',
        city: 'Mumbai',
        country: 'India',
        contactPerson: 'Vikram Singh',
        phone: '+91 22 2839 2200',
        email: 'mumbai@lenscore.com',
        isCentralHub: false,
        activeOrdersCount: 0,
        totalStockUnits: 0,
        totalStockValue: 0,
      },
    }),
    prisma.depot.create({
      data: {
        id: 'dep-sin',
        code: 'DEP-SIN',
        name: 'Singapore Gateway Depot',
        address: 'Changi Cargo Complex, Singapore 486612',
        city: 'Singapore',
        country: 'Singapore',
        contactPerson: 'Lee Wei Ming',
        phone: '+65 6543 2100',
        email: 'singapore@lenscore.com',
        isCentralHub: false,
        activeOrdersCount: 0,
        totalStockUnits: 0,
        totalStockValue: 0,
      },
    }),
  ]);
  console.log(`✅ Created ${depots.length} depots`);

  // Create Users with production-ready salted hashes
  console.log('👤 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'usr-admin',
        name: 'Sarah Jenkins',
        email: 'sarah.admin@lenscore.com',
        role: 'SUPER_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        phone: '+1 415 890 1200',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('Admin@Growth2026!'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'usr-mgr',
        name: 'Marcus Vance',
        email: 'marcus.vance@lenscore.com',
        role: 'MANAGER',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        phone: '+1 415 890 1205',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('Manager@Growth2026!'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'usr-erp',
        name: 'Priya Menon',
        email: 'priya.erp@lenscore.com',
        role: 'ERP_USER',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        phone: '+971 4 555 0190',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('ErpUser@Growth2026!'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'usr-dep-dxb',
        name: 'Tariq Al-Mansoor',
        email: 'tariq.dxb@lenscore.com',
        role: 'DEPOT_USER',
        assignedDepotId: 'dep-dxb',
        assignedDepotName: 'Dubai Logistics Hub',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        phone: '+971 4 881 2299',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('Depot@Dubai2026!'),
      },
    }),
    prisma.user.create({
      data: {
        id: 'usr-dep-blr',
        name: 'Arun Kumar',
        email: 'arun.blr@lenscore.com',
        role: 'DEPOT_USER',
        assignedDepotId: 'dep-blr',
        assignedDepotName: 'Bangalore Central Depot',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        phone: '+91 80 2839 1100',
        status: 'ACTIVE',
        passwordHash: hashSeedPassword('Depot@Bangalore2026!'),
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  console.log('🎉 Clean database seed completed successfully!');
  console.log('📝 Database is now ready for client handover with:');
  console.log('   - 5 test users with different roles');
  console.log('   - 4 basic depots (BLR, DXB, BOM, SIN)');
  console.log('   - Default company settings');
  console.log('   - No demo data (products, customers, inventory, etc.)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
