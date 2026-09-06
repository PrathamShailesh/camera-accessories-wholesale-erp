import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:753951@localhost:5432/camera_erp_dev?schema=public',
    },
  },
});

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('🌱 Starting PostgreSQL master data seed for camera_erp_dev...');

  // 1. Company Settings
  await prisma.companySettings.upsert({
    where: { id: 'global-settings' },
    update: {},
    create: {
      id: 'global-settings',
      companyName: 'ARIB GLOBAL General Trading LLC',
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
      swiftBic: 'CBDUAEADXXX',
      iban: 'AE91 0230 0000 0100 2416 343',
      routingCode: 'CBD-0230',
      invoicePrefix: 'INV-2026-',
      proformaPrefix: 'PF-2026-',
      invoiceNextNumber: 1,
      proformaNextNumber: 1,
    },
  });
  console.log('✅ Company settings upserted');

  // 2. Central Depot
  const depot = await prisma.depot.upsert({
    where: { code: 'DEP-CENTRAL' },
    update: {},
    create: {
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
  console.log(`✅ Central depot ensured (${depot.id})`);

  // 3. System Users
  await prisma.user.upsert({
    where: { email: 'admin@aribglobal.com' },
    update: { status: 'ACTIVE' },
    create: {
      id: 'usr-admin',
      name: 'System Administrator',
      email: 'admin@aribglobal.com',
      role: 'SUPER_ADMIN',
      phone: '+971 4 800 0100',
      status: 'ACTIVE',
      passwordHash: hashSeedPassword('Admin@Arib2026!'),
    },
  });

  await prisma.user.upsert({
    where: { email: 'depot@aribglobal.com' },
    update: {},
    create: {
      id: 'usr-depot',
      name: 'Depot Manager',
      email: 'depot@aribglobal.com',
      role: 'DEPOT_USER',
      assignedDepotId: depot.id,
      assignedDepotName: depot.name,
      phone: '+971 4 800 0100',
      status: 'ACTIVE',
      passwordHash: hashSeedPassword('Depot@Arib2026!'),
    },
  });
  console.log('✅ Users ensured (admin & depot)');

  // 4. Categories
  const catCamera = await prisma.category.upsert({
    where: { slug: 'cinema-cameras' },
    update: {},
    create: {
      id: 'cat-cameras',
      name: 'Cinema Cameras',
      slug: 'cinema-cameras',
      description: 'Professional cinema bodies and video production systems',
    },
  });

  const catLenses = await prisma.category.upsert({
    where: { slug: 'optical-lenses' },
    update: {},
    create: {
      id: 'cat-lenses',
      name: 'Optical Lenses',
      slug: 'optical-lenses',
      description: 'Cine prime lenses, zoom lenses, and mount adapters',
    },
  });
  console.log('✅ Categories ensured');

  // 5. Products
  await prisma.product.upsert({
    where: { sku: 'SONY-FX3-BODY' },
    update: {},
    create: {
      id: 'prod-fx3',
      sku: 'SONY-FX3-BODY',
      name: 'Sony FX3 Full-Frame Cinema Line Camera Body',
      brand: 'Sony',
      model: 'ILME-FX3',
      categoryId: catCamera.id,
      categoryName: catCamera.name,
      description: 'Full-frame 4K 120p cinema camera body with XLR handle unit.',
      imageUrl: '/placeholder-product.svg',
      barcode: '4548736125439',
      purchasePrice: 3200,
      wholesalePrice: 3899,
      sellingPrice: 4099,
      taxRate: 5,
      minStockLevel: 5,
      totalStock: 12,
      trackSerial: true,
      status: 'ACTIVE',
      inventories: {
        create: {
          depotId: depot.id,
          quantity: 12,
          availableQuantity: 12,
          allocatedQuantity: 0,
          minStockLevel: 5,
        },
      },
    },
  });

  await prisma.product.upsert({
    where: { sku: 'SONY-2470-GM2' },
    update: {},
    create: {
      id: 'prod-2470gm2',
      sku: 'SONY-2470-GM2',
      name: 'Sony FE 24-70mm f/2.8 GM II Zoom Lens',
      brand: 'Sony',
      model: 'SEL2470GM2',
      categoryId: catLenses.id,
      categoryName: catLenses.name,
      description: 'Standard zoom G Master series full-frame E-mount lens.',
      imageUrl: '/placeholder-product.svg',
      barcode: '4548736133823',
      purchasePrice: 1700,
      wholesalePrice: 1999,
      sellingPrice: 2199,
      taxRate: 5,
      minStockLevel: 4,
      totalStock: 8,
      trackSerial: true,
      status: 'ACTIVE',
      inventories: {
        create: {
          depotId: depot.id,
          quantity: 8,
          availableQuantity: 8,
          allocatedQuantity: 0,
          minStockLevel: 4,
        },
      },
    },
  });

  await prisma.product.upsert({
    where: { sku: 'CANON-R5C-BODY' },
    update: {},
    create: {
      id: 'prod-r5c',
      sku: 'CANON-R5C-BODY',
      name: 'Canon EOS R5 C Full-Frame Hybrid Cinema Camera',
      brand: 'Canon',
      model: 'EOS R5 C',
      categoryId: catCamera.id,
      categoryName: catCamera.name,
      description: '8K 60p full-frame non-stop cinema recording with internal cooling.',
      imageUrl: '/placeholder-product.svg',
      barcode: '4549292193527',
      purchasePrice: 3600,
      wholesalePrice: 4299,
      sellingPrice: 4499,
      taxRate: 5,
      minStockLevel: 3,
      totalStock: 6,
      trackSerial: true,
      status: 'ACTIVE',
      inventories: {
        create: {
          depotId: depot.id,
          quantity: 6,
          availableQuantity: 6,
          allocatedQuantity: 0,
          minStockLevel: 3,
        },
      },
    },
  });
  console.log('✅ Products ensured');

  // 6. Customers
  await prisma.customer.upsert({
    where: { email: 'purchasing@aerocine.com' },
    update: {},
    create: {
      id: 'cust-aerocine',
      customerCode: 'CUST-UAE-001',
      companyName: 'Aero Cine Productions LLC',
      contactPerson: 'Kareem Al Mansoori',
      email: 'purchasing@aerocine.com',
      phone: '+971 4 398 2200',
      billingAddress: 'Studio City, Building 4, Office 302, Dubai, UAE',
      shippingAddress: 'Central Logistics Hub, Free Zone Area, Dubai, UAE',
      country: 'United Arab Emirates',
      taxNumber: 'TRN-100829102900003',
      paymentTerms: 'NET_30',
      creditLimit: 75000,
      currentBalance: 0,
      status: 'ACTIVE',
      totalOrders: 2,
      totalSpent: 12480,
    },
  });

  await prisma.customer.upsert({
    where: { email: 'equipment@redsea-media.com' },
    update: {},
    create: {
      id: 'cust-redsea',
      customerCode: 'CUST-SAU-002',
      companyName: 'Red Sea Media Group',
      contactPerson: 'Faisal bin Saud',
      email: 'equipment@redsea-media.com',
      phone: '+966 11 482 9911',
      billingAddress: 'King Fahd Road, Al Olaya, Riyadh, Saudi Arabia',
      shippingAddress: 'Riyadh Air Cargo Terminal, Saudi Arabia',
      country: 'Saudi Arabia',
      taxNumber: 'VAT-SA-3981029310',
      paymentTerms: 'NET_15',
      creditLimit: 120000,
      currentBalance: 0,
      status: 'ACTIVE',
      totalOrders: 1,
      totalSpent: 8600,
    },
  });
  console.log('✅ Customers ensured');

  // 7. Suppliers
  await prisma.supplier.upsert({
    where: { id: 'supp-sony-me' },
    update: {},
    create: {
      id: 'supp-sony-me',
      name: 'Sony Middle East & Africa FZE',
      contactPerson: 'Kenji Takahashi',
      email: 'pro-sales@sony-mea.com',
      phone: '+971 4 881 5000',
      address: 'JAFZA View 19, Jebel Ali Free Zone, Dubai, UAE',
      country: 'United Arab Emirates',
      taxId: 'TRN-100234567800003',
      paymentTerms: 'NET_60',
    },
  });

  await prisma.supplier.upsert({
    where: { id: 'supp-canon-me' },
    update: {},
    create: {
      id: 'supp-canon-me',
      name: 'Canon Middle East FZ-LLC',
      contactPerson: 'David Miller',
      email: 'distribution@canon-me.com',
      phone: '+971 4 444 1100',
      address: 'Dubai Internet City, Building 10, Dubai, UAE',
      country: 'United Arab Emirates',
      taxId: 'TRN-100883344500003',
      paymentTerms: 'NET_30',
    },
  });
  console.log('✅ Suppliers ensured');

  console.log('\n🎉 PostgreSQL database camera_erp_dev seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
