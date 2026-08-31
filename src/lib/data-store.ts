import {
  User,
  Depot,
  Category,
  Product,
  SerialNumber,
  DepotInventory,
  StockTransaction,
  StockTransfer,
  StockAdjustment,
  Customer,
  Supplier,
  Proforma,
  TaxInvoice,
  Shipment,
  CloudDocument,
  AuditLog,
  Notification,
  ProfitabilityMetric,
  BusinessInsight,
  CompanySettings,
  UserRole,
} from '@/types/erp';
import { formatUSD } from '@/lib/utils';

// Initial Mock Dataset for Camera & Accessories Wholesale ERP
const INITIAL_DEPOTS: Depot[] = [
  {
    id: 'dep-blr',
    code: 'DEP-BLR',
    name: 'Bangalore Central Depot',
    address: 'Warehouse #14, Peenya Industrial Area, Phase 2',
    city: 'Bangalore',
    country: 'India',
    contactPerson: 'Arun Kumar',
    phone: '+91 80 2839 1100',
    email: 'blr-depot@lenscore-erp.com',
    isCentralHub: true,
    activeOrdersCount: 3,
    totalStockUnits: 340,
    totalStockValue: 512000,
  },
  {
    id: 'dep-dxb',
    code: 'DEP-DXB',
    name: 'Dubai Logistics Hub',
    address: 'Bay 42, Jebel Ali Free Zone (JAFZA) South',
    city: 'Dubai',
    country: 'United Arab Emirates',
    contactPerson: 'Tariq Al-Mansoor',
    phone: '+971 4 881 2299',
    email: 'dxb-hub@lenscore-erp.com',
    isCentralHub: false,
    activeOrdersCount: 5,
    totalStockUnits: 285,
    totalStockValue: 624500,
  },
  {
    id: 'dep-bom',
    code: 'DEP-BOM',
    name: 'Mumbai Marine Depot',
    address: 'Gala 8B, Kanjurmarg West Industrial Estate',
    city: 'Mumbai',
    country: 'India',
    contactPerson: 'Vikram Joshi',
    phone: '+91 22 6120 4455',
    email: 'mumbai-depot@lenscore-erp.com',
    isCentralHub: false,
    activeOrdersCount: 2,
    totalStockUnits: 190,
    totalStockValue: 298000,
  },
  {
    id: 'dep-sin',
    code: 'DEP-SIN',
    name: 'Singapore Gateway Depot',
    address: '15 Changi South Street 2, #03-01',
    city: 'Singapore',
    country: 'Singapore',
    contactPerson: 'Eileen Tan',
    phone: '+65 6542 9901',
    email: 'singapore-gateway@lenscore-erp.com',
    isCentralHub: false,
    activeOrdersCount: 1,
    totalStockUnits: 220,
    totalStockValue: 480000,
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Sarah Jenkins',
    email: 'sarah.admin@lenscore.com',
    role: 'SUPER_ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 415 890 1200',
    status: 'ACTIVE',
    lastLogin: '2026-08-24T10:15:00Z',
  },
  {
    id: 'usr-mgr',
    name: 'Marcus Vance',
    email: 'marcus.vance@lenscore.com',
    role: 'MANAGER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+1 415 890 1205',
    status: 'ACTIVE',
    lastLogin: '2026-08-24T11:45:00Z',
  },
  {
    id: 'usr-erp',
    name: 'Priya Menon',
    email: 'priya.erp@lenscore.com',
    role: 'ERP_USER',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    phone: '+971 4 555 0190',
    status: 'ACTIVE',
    lastLogin: '2026-08-24T13:10:00Z',
  },
  {
    id: 'usr-dep-dxb',
    name: 'Tariq Al-Mansoor',
    email: 'tariq.dxb@lenscore.com',
    role: 'DEPOT_USER',
    assignedDepotId: 'dep-dxb',
    assignedDepotName: 'Dubai Logistics Hub',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+971 4 881 2299',
    status: 'ACTIVE',
    lastLogin: '2026-08-24T12:30:00Z',
  },
  {
    id: 'usr-dep-blr',
    name: 'Arun Kumar',
    email: 'arun.blr@lenscore.com',
    role: 'DEPOT_USER',
    assignedDepotId: 'dep-blr',
    assignedDepotName: 'Bangalore Central Depot',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+91 80 2839 1100',
    status: 'ACTIVE',
    lastLogin: '2026-08-24T09:00:00Z',
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-cam', name: 'Cinema & Mirrorless Cameras', slug: 'cameras', description: 'Professional cinema bodies and full-frame camera systems', icon: 'Camera', productCount: 4 },
  { id: 'cat-len', name: 'Cinema & Prime Lenses', slug: 'lenses', description: 'High-speed cinema primes and zoom optics', icon: 'Disc', productCount: 3 },
  { id: 'cat-lig', name: 'Professional Lighting & Flashes', slug: 'lighting', description: 'Studio strobes, continuous LED point sources & panels', icon: 'SunMedium', productCount: 2 },
  { id: 'cat-aud', name: 'Audio & Wireless Microphones', slug: 'audio', description: 'Wireless transmitters, shotgun mics and field recorders', icon: 'Mic', productCount: 2 },
  { id: 'cat-sto', name: 'High-Speed Storage & Media', slug: 'storage', description: 'CFexpress Type A/B, Cinema SSDs and UHS-II SD cards', icon: 'HardDrive', productCount: 2 },
  { id: 'cat-sup', name: 'Gimbals, Cages & Support', slug: 'support', description: 'Electronic gimbals, follow focus units, and heavy-duty carbon tripods', icon: 'Video', productCount: 2 },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-eos-r5',
    sku: 'EOS-R5',
    name: 'Canon EOS R5 Mirrorless Camera Body',
    brand: 'Canon',
    model: 'EOS R5 (45MP 8K Raw)',
    categoryId: 'cat-cam',
    categoryName: 'Cinema & Mirrorless Cameras',
    subcategory: 'Full-Frame Mirrorless',
    description: 'High-resolution full-frame mirrorless camera featuring 45MP CMOS sensor, 8K30p internal RAW video, and 5-axis sensor-shift image stabilization.',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    barcode: '4549292157307',
    trackSerial: true,
    purchasePrice: 2800.0,
    sellingPrice: 3899.0,
    wholesalePrice: 3399.0,
    taxRate: 5.0,
    minStockLevel: 10,
    status: 'ACTIVE',
    totalStock: 50,
    depotBreakdown: {
      'dep-blr': 25,
      'dep-dxb': 15,
      'dep-bom': 10,
      'dep-sin': 0,
    },
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'prod-sony-fx3',
    sku: 'SONY-FX3',
    name: 'Sony FX3 Full-Frame Cinema Line Camera',
    brand: 'Sony',
    model: 'ILME-FX3',
    categoryId: 'cat-cam',
    categoryName: 'Cinema & Mirrorless Cameras',
    subcategory: 'Cinema Line',
    description: 'Compact cinema line camera with 12.1MP full-frame Exmor R BSI sensor, UHD 4K up to 120p, 15+ stops dynamic range, S-Cinetone, and detachable XLR top handle unit.',
    imageUrl: 'https://images.unsplash.com/photo-1502982720700-befe97b2ff83?w=600&auto=format&fit=crop&q=80',
    barcode: '027242921863',
    trackSerial: true,
    purchasePrice: 3100.0,
    sellingPrice: 4298.0,
    wholesalePrice: 3850.0,
    taxRate: 5.0,
    minStockLevel: 8,
    status: 'ACTIVE',
    totalStock: 38,
    depotBreakdown: {
      'dep-blr': 12,
      'dep-dxb': 18,
      'dep-bom': 4,
      'dep-sin': 4,
    },
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-21T00:00:00Z',
  },
  {
    id: 'prod-nikon-z8',
    sku: 'NIKON-Z8',
    name: 'Nikon Z8 8K Full-Frame Mirrorless Camera',
    brand: 'Nikon',
    model: 'Z8 Body',
    categoryId: 'cat-cam',
    categoryName: 'Cinema & Mirrorless Cameras',
    subcategory: 'Professional Mirrorless',
    description: '45.7MP stacked BSI CMOS sensor, internal 8.3K60p N-RAW & 4.1K120p ProRes RAW, compact flagship form factor.',
    imageUrl: 'https://images.unsplash.com/photo-1500634245200-e5245c7574ef?w=600&auto=format&fit=crop&q=80',
    barcode: '018208016952',
    trackSerial: true,
    purchasePrice: 3000.0,
    sellingPrice: 3999.0,
    wholesalePrice: 3599.0,
    taxRate: 5.0,
    minStockLevel: 5,
    status: 'ACTIVE',
    totalStock: 22,
    depotBreakdown: {
      'dep-blr': 8,
      'dep-dxb': 8,
      'dep-bom': 3,
      'dep-sin': 3,
    },
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-08-18T00:00:00Z',
  },
  {
    id: 'prod-red-komodo-x',
    sku: 'RED-KOMODO-X',
    name: 'RED DIGITAL CINEMA KOMODO-X 6K Camera',
    brand: 'RED',
    model: 'KOMODO-X 6K S35',
    categoryId: 'cat-cam',
    categoryName: 'Cinema & Mirrorless Cameras',
    subcategory: 'Production Cinema',
    description: '6K S35 Global Shutter CMOS Sensor, 6K up to 80fps, 4K up to 120fps, integrated RF mount, micro V-lock battery interface.',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    barcode: '719318357492',
    trackSerial: true,
    purchasePrice: 7800.0,
    sellingPrice: 9995.0,
    wholesalePrice: 8900.0,
    taxRate: 5.0,
    minStockLevel: 3,
    status: 'ACTIVE',
    totalStock: 12,
    depotBreakdown: {
      'dep-blr': 2,
      'dep-dxb': 6,
      'dep-bom': 1,
      'dep-sin': 3,
    },
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  },
  {
    id: 'prod-rf-24-70',
    sku: 'CANON-RF-2470',
    name: 'Canon RF 24-70mm f/2.8 L IS USM Lens',
    brand: 'Canon',
    model: 'RF 24-70mm f/2.8L',
    categoryId: 'cat-len',
    categoryName: 'Cinema & Prime Lenses',
    subcategory: 'Zoom Lenses',
    description: 'Workhorse standard zoom lens for Canon RF mount cameras featuring constant f/2.8 aperture, 5 stops of optical image stabilization, and Nano USM autofocus.',
    imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&auto=format&fit=crop&q=80',
    barcode: '4549292152289',
    trackSerial: true,
    purchasePrice: 1750.0,
    sellingPrice: 2399.0,
    wholesalePrice: 2099.0,
    taxRate: 5.0,
    minStockLevel: 8,
    status: 'ACTIVE',
    totalStock: 45,
    depotBreakdown: {
      'dep-blr': 20,
      'dep-dxb': 15,
      'dep-bom': 5,
      'dep-sin': 5,
    },
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-08-19T00:00:00Z',
  },
  {
    id: 'prod-sony-24-70-gm2',
    sku: 'SONY-FE-2470-GM2',
    name: 'Sony FE 24-70mm f/2.8 GM II Lens',
    brand: 'Sony',
    model: 'SEL2470GM2',
    categoryId: 'cat-len',
    categoryName: 'Cinema & Prime Lenses',
    subcategory: 'G Master Zoom',
    description: 'Redesigned flagship standard zoom lens, 22% lighter and 18% smaller than predecessor, equipped with four XD linear AF motors and dedicated aperture ring.',
    imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&auto=format&fit=crop&q=80',
    barcode: '027242924154',
    trackSerial: true,
    purchasePrice: 1650.0,
    sellingPrice: 2298.0,
    wholesalePrice: 1999.0,
    taxRate: 5.0,
    minStockLevel: 10,
    status: 'ACTIVE',
    totalStock: 35,
    depotBreakdown: {
      'dep-blr': 15,
      'dep-dxb': 12,
      'dep-bom': 4,
      'dep-sin': 4,
    },
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-08-22T00:00:00Z',
  },
  {
    id: 'prod-aputure-600d',
    sku: 'APUTURE-600D-PRO',
    name: 'Aputure LS 600d Pro Daylight LED Light',
    brand: 'Aputure',
    model: 'LS 600d Pro (V-Mount)',
    categoryId: 'cat-lig',
    categoryName: 'Professional Lighting & Flashes',
    subcategory: 'Point Source LED',
    description: 'Powerful 600W COB daylight LED fixture producing up to 8,500+ lux at 3m with reflector, weather-resistant build, Sidus Link & wireless DMX control.',
    imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&auto=format&fit=crop&q=80',
    barcode: '6971842181023',
    trackSerial: true,
    purchasePrice: 1350.0,
    sellingPrice: 1890.0,
    wholesalePrice: 1620.0,
    taxRate: 5.0,
    minStockLevel: 6,
    status: 'ACTIVE',
    totalStock: 26,
    depotBreakdown: {
      'dep-blr': 10,
      'dep-dxb': 10,
      'dep-bom': 3,
      'dep-sin': 3,
    },
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'prod-dji-rs3-pro',
    sku: 'DJI-RS3-PRO',
    name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
    brand: 'DJI',
    model: 'RS 3 Pro Combo',
    categoryId: 'cat-sup',
    categoryName: 'Gimbals, Cages & Support',
    subcategory: 'Handheld Gimbals',
    description: 'Professional 3-axis camera gimbal with extended carbon fiber axis arms, automated axis locks, 4.5kg tested payload, LiDAR focusing compatibility.',
    imageUrl: 'https://images.unsplash.com/photo-1589872516388-60146da2010d?w=600&auto=format&fit=crop&q=80',
    barcode: '190021057432',
    trackSerial: true,
    purchasePrice: 820.0,
    sellingPrice: 1099.0,
    wholesalePrice: 950.0,
    taxRate: 5.0,
    minStockLevel: 8,
    status: 'ACTIVE',
    totalStock: 40,
    depotBreakdown: {
      'dep-blr': 15,
      'dep-dxb': 15,
      'dep-bom': 5,
      'dep-sin': 5,
    },
    createdAt: '2026-02-12T00:00:00Z',
    updatedAt: '2026-08-21T00:00:00Z',
  },
  {
    id: 'prod-sandisk-cfexpress',
    sku: 'SANDISK-CFE-512',
    name: 'SanDisk PRO-CINEMA CFexpress Type B 512GB',
    brand: 'SanDisk',
    model: 'SDCFE-512G-ANCIN',
    categoryId: 'cat-sto',
    categoryName: 'High-Speed Storage & Media',
    subcategory: 'Memory Cards',
    description: 'Cinema-grade CFexpress Type B card featuring sustained minimum write speeds of 1400MB/s, max read speeds of 1700MB/s, optimized for flawless 8K video capture.',
    imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80',
    barcode: '619659194208',
    trackSerial: false,
    purchasePrice: 280.0,
    sellingPrice: 479.99,
    wholesalePrice: 380.0,
    taxRate: 5.0,
    minStockLevel: 25,
    status: 'ACTIVE',
    totalStock: 140,
    depotBreakdown: {
      'dep-blr': 60,
      'dep-dxb': 50,
      'dep-bom': 15,
      'dep-sin': 15,
    },
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z',
  },
  {
    id: 'prod-dji-mic-2',
    sku: 'DJI-MIC-2',
    name: 'DJI Mic 2 Wireless Microphone System (2 TX + 1 RX)',
    brand: 'DJI',
    model: 'DJI Mic 2 Transmitter Combo',
    categoryId: 'cat-aud',
    categoryName: 'Audio & Wireless Microphones',
    subcategory: 'Wireless Microphones',
    description: 'All-in-one wireless audio recording system with 32-bit float internal recording, intelligent active noise cancellation, 250m transmission range, charging case.',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    barcode: '190021098451',
    trackSerial: false,
    purchasePrice: 245.0,
    sellingPrice: 349.0,
    wholesalePrice: 295.0,
    taxRate: 5.0,
    minStockLevel: 20,
    status: 'ACTIVE',
    totalStock: 95,
    depotBreakdown: {
      'dep-blr': 40,
      'dep-dxb': 35,
      'dep-bom': 10,
      'dep-sin': 10,
    },
    createdAt: '2026-02-18T00:00:00Z',
    updatedAt: '2026-08-23T00:00:00Z',
  },
];

const INITIAL_SERIAL_NUMBERS: SerialNumber[] = [
  // Canon EOS R5 Serials
  { id: 'sn-cr5-001', productId: 'prod-eos-r5', productSku: 'EOS-R5', productName: 'Canon EOS R5 Mirrorless Camera Body', serialNumber: 'CR5-001', depotId: 'dep-blr', depotName: 'Bangalore Central Depot', status: 'IN_STOCK', createdAt: '2026-08-01T00:00:00Z' },
  { id: 'sn-cr5-002', productId: 'prod-eos-r5', productSku: 'EOS-R5', productName: 'Canon EOS R5 Mirrorless Camera Body', serialNumber: 'CR5-002', depotId: 'dep-blr', depotName: 'Bangalore Central Depot', status: 'IN_STOCK', createdAt: '2026-08-01T00:00:00Z' },
  { id: 'sn-cr5-003', productId: 'prod-eos-r5', productSku: 'EOS-R5', productName: 'Canon EOS R5 Mirrorless Camera Body', serialNumber: 'CR5-003', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'ALLOCATED', invoiceId: 'inv-2026-00001', invoiceNumber: 'INV-2026-00001', createdAt: '2026-08-01T00:00:00Z' },
  { id: 'sn-cr5-004', productId: 'prod-eos-r5', productSku: 'EOS-R5', productName: 'Canon EOS R5 Mirrorless Camera Body', serialNumber: 'CR5-004', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'ALLOCATED', invoiceId: 'inv-2026-00001', invoiceNumber: 'INV-2026-00001', createdAt: '2026-08-01T00:00:00Z' },
  { id: 'sn-cr5-005', productId: 'prod-eos-r5', productSku: 'EOS-R5', productName: 'Canon EOS R5 Mirrorless Camera Body', serialNumber: 'CR5-005', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'IN_STOCK', createdAt: '2026-08-01T00:00:00Z' },
  // Sony FX3 Serials
  { id: 'sn-fx3-101', productId: 'prod-sony-fx3', productSku: 'SONY-FX3', productName: 'Sony FX3 Full-Frame Cinema Line Camera', serialNumber: 'SFX3-101', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'DISPATCHED', invoiceId: 'inv-2026-00002', invoiceNumber: 'INV-2026-00002', createdAt: '2026-08-02T00:00:00Z' },
  { id: 'sn-fx3-102', productId: 'prod-sony-fx3', productSku: 'SONY-FX3', productName: 'Sony FX3 Full-Frame Cinema Line Camera', serialNumber: 'SFX3-102', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'IN_STOCK', createdAt: '2026-08-02T00:00:00Z' },
  { id: 'sn-fx3-103', productId: 'prod-sony-fx3', productSku: 'SONY-FX3', productName: 'Sony FX3 Full-Frame Cinema Line Camera', serialNumber: 'SFX3-103', depotId: 'dep-blr', depotName: 'Bangalore Central Depot', status: 'IN_STOCK', createdAt: '2026-08-02T00:00:00Z' },
  // Sony 24-70 GM2 Serials
  { id: 'sn-gm2-801', productId: 'prod-sony-24-70-gm2', productSku: 'SONY-FE-2470-GM2', productName: 'Sony FE 24-70mm f/2.8 GM II Lens', serialNumber: 'SEL2470-801', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'DISPATCHED', invoiceId: 'inv-2026-00002', invoiceNumber: 'INV-2026-00002', createdAt: '2026-08-05T00:00:00Z' },
  { id: 'sn-gm2-802', productId: 'prod-sony-24-70-gm2', productSku: 'SONY-FE-2470-GM2', productName: 'Sony FE 24-70mm f/2.8 GM II Lens', serialNumber: 'SEL2470-802', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'IN_STOCK', createdAt: '2026-08-05T00:00:00Z' },
  // RED Komodo-X Serials
  { id: 'sn-red-401', productId: 'prod-red-komodo-x', productSku: 'RED-KOMODO-X', productName: 'RED DIGITAL CINEMA KOMODO-X 6K Camera', serialNumber: 'RED-KX-401', depotId: 'dep-dxb', depotName: 'Dubai Logistics Hub', status: 'IN_STOCK', createdAt: '2026-08-10T00:00:00Z' },
  { id: 'sn-red-402', productId: 'prod-red-komodo-x', productSku: 'RED-KOMODO-X', productName: 'RED DIGITAL CINEMA KOMODO-X 6K Camera', serialNumber: 'RED-KX-402', depotId: 'dep-sin', depotName: 'Singapore Gateway Depot', status: 'IN_STOCK', createdAt: '2026-08-10T00:00:00Z' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-apex',
    customerCode: 'CUST-DXB-010',
    companyName: 'Apex Media & Broadcast FZ-LLC',
    contactPerson: 'Zayd Al-Hashimi',
    email: 'zayd.hashimi@apexmediadxb.com',
    phone: '+971 4 391 8840',
    billingAddress: 'Studio City Tower, Office 1402, Dubai Studio City',
    shippingAddress: 'Apex Media Hub, Warehouse 11, Dubai Production City',
    country: 'United Arab Emirates',
    taxNumber: 'AE-TRN-100482910300003',
    paymentTerms: 'NET_30',
    creditLimit: 150000.0,
    currentBalance: 42800.0,
    notes: 'Premium broadcast client. Always requests express air freight with fragile handling stamps.',
    status: 'ACTIVE',
    totalOrders: 14,
    totalSpent: 384500.0,
    createdAt: '2025-11-10T00:00:00Z',
  },
  {
    id: 'cust-cinegear',
    customerCode: 'CUST-IND-025',
    companyName: 'CineGear Studios India Pvt Ltd',
    contactPerson: 'Rajesh Ramanathan',
    email: 'rajesh@cinegearstudios.in',
    phone: '+91 80 4120 7700',
    billingAddress: '12th Main, Indiranagar 2nd Stage',
    shippingAddress: 'CineGear Equipment Lot, HSR Layout Sector 1',
    country: 'India',
    taxNumber: '29AAACC1206K1Z8',
    paymentTerms: 'NET_15',
    creditLimit: 80000.0,
    currentBalance: 12500.0,
    notes: 'Rental house client with ongoing bulk lens orders.',
    status: 'ACTIVE',
    totalOrders: 9,
    totalSpent: 198000.0,
    createdAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'cust-horizon',
    customerCode: 'CUST-IND-042',
    companyName: 'Horizon Film & Television Works',
    contactPerson: 'Pooja Mehra',
    email: 'pooja.mehra@horizonfilms.co.in',
    phone: '+91 22 2630 9100',
    billingAddress: 'Link Road, Andheri West',
    shippingAddress: 'Studio Floor 4, Film City Complex, Goregaon East',
    country: 'India',
    taxNumber: '27AAACH4920L1Z2',
    paymentTerms: 'ADVANCE_50',
    creditLimit: 50000.0,
    currentBalance: 0.0,
    notes: 'Bollywood commercial production house.',
    status: 'ACTIVE',
    totalOrders: 6,
    totalSpent: 145000.0,
    createdAt: '2026-02-14T00:00:00Z',
  },
  {
    id: 'cust-reddot',
    customerCode: 'CUST-SGP-008',
    companyName: 'RedDot Cinematography Singapore Pte',
    contactPerson: 'Desmond Lim',
    email: 'desmond@reddotcinema.sg',
    phone: '+65 6742 8811',
    billingAddress: '8 Kallang Avenue, #08-05 Aperia Tower 1',
    shippingAddress: '8 Kallang Avenue, #08-05 Aperia Tower 1',
    country: 'Singapore',
    taxNumber: 'UEN201804291K',
    paymentTerms: 'NET_30',
    creditLimit: 120000.0,
    currentBalance: 24500.0,
    notes: 'Leading Southeast Asian regional distributor partner.',
    status: 'ACTIVE',
    totalOrders: 8,
    totalSpent: 260000.0,
    createdAt: '2026-01-22T00:00:00Z',
  },
];

const INITIAL_PROFORMAS: Proforma[] = [
  {
    id: 'pf-2026-00001',
    proformaNumber: 'PF-2026-00001',
    customerId: 'cust-apex',
    customerName: 'Zayd Al-Hashimi',
    customerEmail: 'zayd.hashimi@apexmediadxb.com',
    customerCompany: 'Apex Media & Broadcast FZ-LLC',
    customerPhone: '+971 4 391 8840',
    billingAddress: 'Studio City Tower, Office 1402, Dubai Studio City, Dubai, UAE',
    shippingAddress: 'Apex Media Hub, Warehouse 11, Dubai Production City, Dubai, UAE',
    managerId: 'usr-mgr',
    managerName: 'Marcus Vance',
    issueDate: '2026-08-20',
    expiryDate: '2026-09-04',
    paymentTerms: 'NET 30 days from dispatch',
    deliveryTerms: 'Air Freight via DHL Express (CIF Dubai)',
    notes: 'Includes manufacturer warranty and priority dispatch from Dubai Logistics Hub.',
    items: [
      {
        id: 'pfi-1',
        productId: 'prod-eos-r5',
        productSku: 'EOS-R5',
        productName: 'Canon EOS R5 Mirrorless Camera Body',
        brand: 'Canon',
        quantity: 2,
        unitPrice: 3899.0,
        discountPercent: 5.0,
        taxRate: 5.0,
        taxAmount: 370.41,
        totalPrice: 7778.51,
        selectedDepotId: 'dep-dxb',
        selectedDepotName: 'Dubai Logistics Hub',
        trackSerial: true,
      },
      {
        id: 'pfi-2',
        productId: 'prod-sandisk-cfexpress',
        productSku: 'SANDISK-CFE-512',
        productName: 'SanDisk PRO-CINEMA CFexpress Type B 512GB',
        brand: 'SanDisk',
        quantity: 4,
        unitPrice: 479.99,
        discountPercent: 5.0,
        taxRate: 5.0,
        taxAmount: 91.2,
        totalPrice: 1915.16,
        selectedDepotId: 'dep-dxb',
        selectedDepotName: 'Dubai Logistics Hub',
        trackSerial: false,
      },
    ],
    subtotal: 9718.96,
    discountPercent: 5.0,
    discountAmount: 485.95,
    taxAmount: 461.61,
    shippingCost: 150.0,
    otherCharges: 0.0,
    grandTotal: 9844.62,
    currency: 'USD',
    status: 'CONVERTED',
    convertedToInvoiceId: 'inv-2026-00001',
    convertedToInvoiceNumber: 'INV-2026-00001',
    convertedAt: '2026-08-22T14:30:00Z',
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-22T14:30:00Z',
  },
  {
    id: 'pf-2026-00002',
    proformaNumber: 'PF-2026-00002',
    customerId: 'cust-reddot',
    customerName: 'Desmond Lim',
    customerEmail: 'desmond@reddotcinema.sg',
    customerCompany: 'RedDot Cinematography Singapore Pte',
    customerPhone: '+65 6742 8811',
    billingAddress: '8 Kallang Avenue, #08-05 Aperia Tower 1, Singapore',
    shippingAddress: '8 Kallang Avenue, #08-05 Aperia Tower 1, Singapore',
    managerId: 'usr-mgr',
    managerName: 'Marcus Vance',
    issueDate: '2026-08-23',
    expiryDate: '2026-09-07',
    paymentTerms: 'NET 30 days',
    deliveryTerms: 'Courier via FedEx International Priority',
    notes: 'Q3 Cinema Package deal with RED and DJI equipment.',
    items: [
      {
        id: 'pfi-3',
        productId: 'prod-red-komodo-x',
        productSku: 'RED-KOMODO-X',
        productName: 'RED DIGITAL CINEMA KOMODO-X 6K Camera',
        brand: 'RED',
        quantity: 1,
        unitPrice: 9995.0,
        discountPercent: 3.0,
        taxRate: 5.0,
        taxAmount: 484.76,
        totalPrice: 10179.91,
        selectedDepotId: 'dep-sin',
        selectedDepotName: 'Singapore Gateway Depot',
        trackSerial: true,
      },
      {
        id: 'pfi-4',
        productId: 'prod-dji-rs3-pro',
        productSku: 'DJI-RS3-PRO',
        productName: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
        brand: 'DJI',
        quantity: 2,
        unitPrice: 1099.0,
        discountPercent: 3.0,
        taxRate: 5.0,
        taxAmount: 106.6,
        totalPrice: 2238.66,
        selectedDepotId: 'dep-sin',
        selectedDepotName: 'Singapore Gateway Depot',
        trackSerial: true,
      },
    ],
    subtotal: 12193.0,
    discountPercent: 3.0,
    discountAmount: 365.79,
    taxAmount: 591.36,
    shippingCost: 220.0,
    otherCharges: 0.0,
    grandTotal: 12638.57,
    currency: 'USD',
    status: 'CONFIRMED',
    createdAt: '2026-08-23T08:30:00Z',
    updatedAt: '2026-08-24T09:15:00Z',
  },
];

const INITIAL_INVOICES: TaxInvoice[] = [
  {
    id: 'inv-2026-00001',
    invoiceNumber: 'INV-2026-00001',
    proformaId: 'pf-2026-00001',
    proformaNumber: 'PF-2026-00001',
    customerId: 'cust-apex',
    customerName: 'Zayd Al-Hashimi',
    customerEmail: 'zayd.hashimi@apexmediadxb.com',
    customerCompany: 'Apex Media & Broadcast FZ-LLC',
    customerPhone: '+971 4 391 8840',
    billingAddress: 'Studio City Tower, Office 1402, Dubai Studio City, Dubai, UAE',
    shippingAddress: 'Apex Media Hub, Warehouse 11, Dubai Production City, Dubai, UAE',
    depotId: 'dep-dxb',
    depotName: 'Dubai Logistics Hub',
    managerId: 'usr-mgr',
    managerName: 'Marcus Vance',
    issueDate: '2026-08-22',
    dueDate: '2026-09-21',
    paymentTerms: 'NET 30 days',
    paymentStatus: 'UNPAID',
    fulfilmentStatus: 'READY_FOR_PACKING',
    items: [
      {
        id: 'ivi-1',
        productId: 'prod-eos-r5',
        productSku: 'EOS-R5',
        productName: 'Canon EOS R5 Mirrorless Camera Body',
        brand: 'Canon',
        quantity: 2,
        unitPrice: 3899.0,
        taxRate: 5.0,
        taxAmount: 370.41,
        totalPrice: 7778.51,
        depotId: 'dep-dxb',
        depotName: 'Dubai Logistics Hub',
        allocatedSerials: ['CR5-003', 'CR5-004'],
        trackSerial: true,
        isPicked: true,
      },
      {
        id: 'ivi-2',
        productId: 'prod-sandisk-cfexpress',
        productSku: 'SANDISK-CFE-512',
        productName: 'SanDisk PRO-CINEMA CFexpress Type B 512GB',
        brand: 'SanDisk',
        quantity: 4,
        unitPrice: 479.99,
        taxRate: 5.0,
        taxAmount: 91.2,
        totalPrice: 1915.16,
        depotId: 'dep-dxb',
        depotName: 'Dubai Logistics Hub',
        allocatedSerials: [],
        trackSerial: false,
        isPicked: true,
      },
    ],
    subtotal: 9718.96,
    discountAmount: 485.95,
    taxAmount: 461.61,
    shippingCost: 150.0,
    otherCharges: 0.0,
    grandTotal: 9844.62,
    currency: 'USD',
    notes: 'Direct flight dispatch from DXB to DWC depot handling.',
    internalRemarks: 'VIP client priority processing. Serials allocated: CR5-003, CR5-004.',
    createdAt: '2026-08-22T14:30:00Z',
    updatedAt: '2026-08-22T14:30:00Z',
  },
  {
    id: 'inv-2026-00002',
    invoiceNumber: 'INV-2026-00002',
    customerId: 'cust-cinegear',
    customerName: 'Rajesh Ramanathan',
    customerEmail: 'rajesh@cinegearstudios.in',
    customerCompany: 'CineGear Studios India Pvt Ltd',
    customerPhone: '+91 80 4120 7700',
    billingAddress: '12th Main, Indiranagar 2nd Stage, Bangalore, India',
    shippingAddress: 'CineGear Equipment Lot, HSR Layout Sector 1, Bangalore, India',
    depotId: 'dep-dxb',
    depotName: 'Dubai Logistics Hub',
    managerId: 'usr-mgr',
    managerName: 'Marcus Vance',
    issueDate: '2026-08-18',
    dueDate: '2026-09-02',
    paymentTerms: 'NET 15 days',
    paymentStatus: 'PAID',
    fulfilmentStatus: 'SHIPPED',
    shipmentId: 'shp-2026-00001',
    items: [
      {
        id: 'ivi-3',
        productId: 'prod-sony-fx3',
        productSku: 'SONY-FX3',
        productName: 'Sony FX3 Full-Frame Cinema Line Camera',
        brand: 'Sony',
        quantity: 1,
        unitPrice: 4298.0,
        taxRate: 5.0,
        taxAmount: 214.9,
        totalPrice: 4512.9,
        depotId: 'dep-dxb',
        depotName: 'Dubai Logistics Hub',
        allocatedSerials: ['SFX3-101'],
        trackSerial: true,
        isPicked: true,
      },
      {
        id: 'ivi-4',
        productId: 'prod-sony-24-70-gm2',
        productSku: 'SONY-FE-2470-GM2',
        productName: 'Sony FE 24-70mm f/2.8 GM II Lens',
        brand: 'Sony',
        quantity: 1,
        unitPrice: 2298.0,
        taxRate: 5.0,
        taxAmount: 114.9,
        totalPrice: 2412.9,
        depotId: 'dep-dxb',
        depotName: 'Dubai Logistics Hub',
        allocatedSerials: ['SEL2470-801'],
        trackSerial: true,
        isPicked: true,
      },
    ],
    subtotal: 6596.0,
    discountAmount: 0.0,
    taxAmount: 329.8,
    shippingCost: 180.0,
    otherCharges: 0.0,
    grandTotal: 7105.8,
    currency: 'USD',
    notes: 'Paid via Wire Transfer on Aug 19, 2026.',
    internalRemarks: 'Airway Bill DHL-9482103847 attached.',
    createdAt: '2026-08-18T11:00:00Z',
    updatedAt: '2026-08-19T16:00:00Z',
  },
];

const INITIAL_SHIPMENTS: Shipment[] = [
  {
    id: 'shp-2026-00001',
    shipmentNumber: 'SHP-2026-00001',
    invoiceId: 'inv-2026-00002',
    invoiceNumber: 'INV-2026-00002',
    customerId: 'cust-cinegear',
    customerName: 'Rajesh Ramanathan',
    customerCompany: 'CineGear Studios India Pvt Ltd',
    destinationCountry: 'India',
    shippingAddress: 'CineGear Equipment Lot, HSR Layout Sector 1, Bangalore, India',
    depotId: 'dep-dxb',
    depotName: 'Dubai Logistics Hub',
    courier: 'DHL_EXPRESS',
    airwayBillNumber: 'DHL-9482103847',
    trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=9482103847',
    shippingDate: '2026-08-19T15:30:00Z',
    estimatedDeliveryDate: '2026-08-25T18:00:00Z',
    shippingCost: 180.0,
    weightKg: 6.4,
    packageCount: 1,
    dimensionsCm: { length: 48, width: 36, height: 28 },
    airwayBillDocUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    packingListDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    packagePhotoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
    status: 'IN_TRANSIT',
    packedBy: 'Tariq Al-Mansoor',
    dispatchedBy: 'Tariq Al-Mansoor',
    createdAt: '2026-08-19T14:00:00Z',
    updatedAt: '2026-08-19T16:00:00Z',
  },
];

const INITIAL_DOCUMENTS: CloudDocument[] = [
  {
    id: 'doc-awb-9482',
    title: 'Airway Bill - DHL-9482103847 (CineGear Bangalore)',
    fileName: 'AWB_DHL_9482103847.pdf',
    fileType: 'application/pdf',
    fileFormat: 'pdf',
    fileSize: 428000,
    cloudinaryUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    cloudinaryPublicId: 'camera-erp-dev2/documents/awb_9482103847',
    category: 'AIRWAY_BILL',
    relatedEntityType: 'SHIPMENT',
    relatedEntityId: 'shp-2026-00001',
    relatedEntityLabel: 'Shipment #SHP-2026-00001 (AWB DHL-9482103847)',
    uploadedBy: 'usr-dep-dxb',
    uploadedByName: 'Tariq Al-Mansoor',
    uploadedAt: '2026-08-19T15:45:00Z',
    tags: ['AWB', 'DHL Express', 'CineGear', 'Dubai Hub'],
  },
  {
    id: 'doc-inv-10002',
    title: 'Tax Invoice INV-2026-00002 (CineGear Studios)',
    fileName: 'Tax_Invoice_INV-2026-00002.pdf',
    fileType: 'application/pdf',
    fileFormat: 'pdf',
    fileSize: 185000,
    cloudinaryUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    cloudinaryPublicId: 'camera-erp-dev2/documents/inv_2026_00002',
    category: 'TAX_INVOICE',
    relatedEntityType: 'INVOICE',
    relatedEntityId: 'inv-2026-00002',
    relatedEntityLabel: 'Invoice #INV-2026-00002',
    uploadedBy: 'usr-mgr',
    uploadedByName: 'Marcus Vance',
    uploadedAt: '2026-08-18T11:30:00Z',
    tags: ['Tax Invoice', 'CineGear', 'USD 7,105.80'],
  },
  {
    id: 'doc-pf-10001',
    title: 'Proforma PF-2026-00001 (Apex Media Dubai)',
    fileName: 'Proforma_PF-2026-00001.pdf',
    fileType: 'application/pdf',
    fileFormat: 'pdf',
    fileSize: 172000,
    cloudinaryUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    cloudinaryPublicId: 'camera-erp-dev2/documents/pf_2026_00001',
    category: 'PROFORMA',
    relatedEntityType: 'PROFORMA',
    relatedEntityId: 'pf-2026-00001',
    relatedEntityLabel: 'Proforma #PF-2026-00001',
    uploadedBy: 'usr-mgr',
    uploadedByName: 'Marcus Vance',
    uploadedAt: '2026-08-20T10:15:00Z',
    tags: ['Proforma', 'Apex Media', 'USD 9,844.62'],
  },
];

const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'tr-2026-001',
    transferNumber: 'TR-2026-001',
    sourceDepotId: 'dep-dxb',
    sourceDepotName: 'Dubai Logistics Hub',
    destinationDepotId: 'dep-blr',
    destinationDepotName: 'Bangalore Central Depot',
    items: [
      {
        productId: 'prod-eos-r5',
        productSku: 'EOS-R5',
        productName: 'Canon EOS R5 Mirrorless Camera Body',
        quantity: 10,
        serialNumbers: ['CR5-010', 'CR5-011', 'CR5-012', 'CR5-013', 'CR5-014', 'CR5-015', 'CR5-016', 'CR5-017', 'CR5-018', 'CR5-019'],
      },
    ],
    status: 'COMPLETED',
    notes: 'Inter-hub replenishment for Bangalore Q3 festival demand.',
    createdBy: 'Marcus Vance',
    createdAt: '2026-08-10T09:00:00Z',
    receivedAt: '2026-08-14T16:00:00Z',
  },
];

const INITIAL_ADJUSTMENTS: StockAdjustment[] = [
  {
    id: 'adj-001',
    productId: 'prod-aputure-600d',
    productSku: 'APUTURE-600D-PRO',
    productName: 'Aputure LS 600d Pro Daylight LED Light',
    depotId: 'dep-dxb',
    depotName: 'Dubai Logistics Hub',
    deltaQty: -1,
    previousQty: 11,
    newQty: 10,
    reason: 'DAMAGED',
    user: 'Tariq Al-Mansoor',
    notes: 'COB fixture casing damaged during external transit inspection. Sent to manufacturer RMA.',
    createdAt: '2026-08-15T11:20:00Z',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud-001',
    userId: 'usr-mgr',
    userName: 'Marcus Vance',
    userRole: 'MANAGER',
    action: 'CONVERT_TO_INVOICE',
    entityType: 'PROFORMA',
    entityId: 'pf-2026-00001',
    entityLabel: 'Proforma PF-2026-00001',
    previousValue: 'Status: CONFIRMED',
    newValue: 'Status: CONVERTED -> Created Invoice INV-2026-00001',
    description: 'Manager Marcus Vance converted Proforma PF-2026-00001 into Tax Invoice INV-2026-00001.',
    ipAddress: '194.67.210.45',
    timestamp: '2026-08-22T14:30:00Z',
  },
  {
    id: 'aud-002',
    userId: 'usr-dep-dxb',
    userName: 'Tariq Al-Mansoor',
    userRole: 'DEPOT_USER',
    action: 'SHIPMENT_DISPATCHED',
    entityType: 'SHIPMENT',
    entityId: 'shp-2026-00001',
    entityLabel: 'Shipment #SHP-2026-00001',
    previousValue: 'Status: READY_FOR_PACKING',
    newValue: 'Status: SHIPPED (AWB: DHL-9482103847)',
    description: 'Depot Operator Tariq Al-Mansoor dispatched shipment via DHL Express with AWB DHL-9482103847.',
    ipAddress: '86.98.112.90',
    timestamp: '2026-08-19T16:00:00Z',
  },
  {
    id: 'aud-003',
    userId: 'usr-mgr',
    userName: 'Marcus Vance',
    userRole: 'MANAGER',
    action: 'DEAL_CONFIRM',
    entityType: 'PROFORMA',
    entityId: 'pf-2026-00002',
    entityLabel: 'Proforma PF-2026-00002',
    previousValue: 'Status: SENT',
    newValue: 'Status: CONFIRMED',
    description: 'Customer RedDot Cinematography SG confirmed Proforma PF-2026-00002 for USD 12,638.57.',
    ipAddress: '194.67.210.45',
    timestamp: '2026-08-24T09:15:00Z',
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    type: 'DEPOT_PACKING_PENDING',
    title: 'New Order Ready for Packing',
    message: 'Tax Invoice INV-2026-00001 has been assigned to Dubai Logistics Hub for picking and packing.',
    link: '/invoices/inv-2026-00001',
    read: false,
    targetRole: 'DEPOT_USER',
    targetDepotId: 'dep-dxb',
    createdAt: '2026-08-22T14:31:00Z',
  },
  {
    id: 'notif-2',
    type: 'PROFORMA_CONFIRMED',
    title: 'Deal Confirmed by Customer',
    message: 'RedDot Cinematography confirmed Proforma PF-2026-00002 (USD 12,638.57). Ready to convert to Tax Invoice.',
    link: '/proformas/pf-2026-00002',
    read: false,
    targetRole: 'MANAGER',
    createdAt: '2026-08-24T09:16:00Z',
  },
  {
    id: 'notif-3',
    type: 'LOW_INVENTORY',
    title: 'Low Stock Alert: RED KOMODO-X 6K',
    message: 'Bangalore Central Depot has only 2 units remaining (Minimum threshold: 3).',
    link: '/products/prod-red-komodo-x',
    read: false,
    targetRole: 'SUPER_ADMIN',
    createdAt: '2026-08-24T08:00:00Z',
  },
];

const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'GROWTH BRIDGE',
  tradingName: 'Growth Bridge',
  logoUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&auto=format&fit=crop&q=80',
  taxRegistrationNumber: 'VAT-99201-US-GLOBAL',
  vatGstNumber: 'TRN-100889218200001',
  companyAddress: 'Office 402, Business Bay, Dubai, UAE',
  phone: '+91 62827 59863',
  email: 'contact@growthbridge.com',
  website: 'https://growthbridge.com',
  currency: 'USD',
  currencySymbol: '$',
  bankDetails: {
    bankName: 'Commercial Bank of Dubai, Sheikh Zayed Road Branch, Dubai, U.A.E.',
    accountName: 'Arib Global General Trading LLC',
    accountNumber: 'AE910230000001002416343',
    swiftBic: 'CBOUAEADXXX',
    iban: 'AE91 0230 0000 0100 2416 343',
    routingCode: 'CBD-0230',
  },
  invoicePrefix: 'INV-2026-',
  proformaPrefix: 'PF-2026-',
  invoiceNextNumber: 3,
  proformaNextNumber: 3,
  defaultPaymentTerms: 'Cash In Advance',
  defaultDeliveryTerms: 'C&F Vietnam Airport',
};

// State Store Class with In-Memory Singleton and LocalStorage/State Cache
class DataStore {
  private depots: Depot[] = [...INITIAL_DEPOTS];
  private users: User[] = [...INITIAL_USERS];
  private categories: Category[] = [...INITIAL_CATEGORIES];
  private products: Product[] = [...INITIAL_PRODUCTS];
  private serialNumbers: SerialNumber[] = [...INITIAL_SERIAL_NUMBERS];
  private customers: Customer[] = [...INITIAL_CUSTOMERS];
  private proformas: Proforma[] = [...INITIAL_PROFORMAS];
  private invoices: TaxInvoice[] = [...INITIAL_INVOICES];
  private shipments: Shipment[] = [...INITIAL_SHIPMENTS];
  private documents: CloudDocument[] = [...INITIAL_DOCUMENTS];
  private transfers: StockTransfer[] = [...INITIAL_TRANSFERS];
  private adjustments: StockAdjustment[] = [...INITIAL_ADJUSTMENTS];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private notifications: Notification[] = [...INITIAL_NOTIFICATIONS];
  private settings: CompanySettings = { ...INITIAL_COMPANY_SETTINGS };

  // Current session user (for demo switcher)
  public currentUser: User = INITIAL_USERS[0];

  public setCurrentUser(userId: string) {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUser = user;
    }
  }

  public getCurrentUser(): User {
    return this.currentUser;
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public createUser(data: Omit<User, 'id'>): User {
    const id = `usr-${Date.now()}`;
    const newUser: User = {
      ...data,
      id,
    };
    this.users.push(newUser);
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'USER',
      entityId: newUser.id,
      entityLabel: `${newUser.name} (${newUser.role})`,
      description: `Created user ${newUser.name} with role ${newUser.role}`,
    });
    return newUser;
  }

  public updateUser(id: string, data: Partial<User>): User | null {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const prev = this.users[idx];
    const updated = { ...prev, ...data };
    this.users[idx] = updated;
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'USER',
      entityId: id,
      entityLabel: `${updated.name} (${updated.role})`,
      description: `Updated user details/role for ${updated.name}`,
    });
    return updated;
  }

  public deleteUser(id: string): boolean {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    const user = this.users[idx];
    this.users.splice(idx, 1);
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'USER',
      entityId: id,
      entityLabel: `${user.name} (${user.role})`,
      description: `Deleted user ${user.name}`,
    });
    return true;
  }

  // --- DEPOTS ---
  public getDepots(): Depot[] {
    return this.depots.map((d) => {
      // dynamically compute stock totals
      let totalUnits = 0;
      let totalVal = 0;
      this.products.forEach((p) => {
        const qty = p.depotBreakdown?.[d.id] || 0;
        totalUnits += qty;
        totalVal += qty * p.purchasePrice;
      });
      const activeOrders = this.invoices.filter(
        (i) => i.depotId === d.id && ['READY_FOR_PACKING', 'PACKED', 'PROCESSING'].includes(i.fulfilmentStatus)
      ).length;
      return {
        ...d,
        totalStockUnits: totalUnits,
        totalStockValue: totalVal,
        activeOrdersCount: activeOrders,
      };
    });
  }

  public getDepotById(id: string): Depot | undefined {
    return this.getDepots().find((d) => d.id === id || d.code.toLowerCase() === id.toLowerCase());
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.products.map((p) => {
      let total = 0;
      if (p.depotBreakdown) {
        Object.values(p.depotBreakdown).forEach((q) => (total += q));
      }
      return { ...p, totalStock: total };
    });
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id || p.sku.toLowerCase() === id.toLowerCase());
  }

  public createProduct(data: Omit<Product, 'id' | 'totalStock' | 'createdAt' | 'updatedAt'>): Product {
    const id = `prod-${data.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      totalStock: Object.values(data.depotBreakdown || {}).reduce((a, b) => a + b, 0),
    };
    this.products.unshift(newProduct);
    this.addAuditLog({
      action: 'STOCK_IN',
      entityType: 'PRODUCT',
      entityId: newProduct.id,
      entityLabel: `${newProduct.name} (${newProduct.sku})`,
      description: `Added new product ${newProduct.name} (SKU: ${newProduct.sku}) with initial stock`,
    });
    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>): Product | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const prev = this.products[idx];
    const updated = { ...prev, ...data, updatedAt: new Date().toISOString() };
    this.products[idx] = updated;
    this.addAuditLog({
      action: 'PRICE_UPDATE',
      entityType: 'PRODUCT',
      entityId: id,
      entityLabel: `${updated.name} (${updated.sku})`,
      previousValue: `Price: $${prev.sellingPrice}, WS: $${prev.wholesalePrice}`,
      newValue: `Price: $${updated.sellingPrice}, WS: $${updated.wholesalePrice}`,
      description: `Updated product specifications for ${updated.name}`,
    });
    return updated;
  }

  // --- SERIAL NUMBERS ---
  public getSerialNumbers(productId?: string, depotId?: string, status?: string): SerialNumber[] {
    return this.serialNumbers.filter((sn) => {
      if (productId && sn.productId !== productId) return false;
      if (depotId && sn.depotId !== depotId) return false;
      if (status && sn.status !== status) return false;
      return true;
    });
  }

  public addSerialNumber(data: Omit<SerialNumber, 'id' | 'createdAt'>): SerialNumber {
    const newSn: SerialNumber = {
      ...data,
      id: `sn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.serialNumbers.push(newSn);
    return newSn;
  }

  public updateSerialStatus(id: string, status: SerialNumber['status'], invoiceId?: string, invoiceNumber?: string) {
    const sn = this.serialNumbers.find((s) => s.id === id || s.serialNumber === id);
    if (sn) {
      sn.status = status;
      if (invoiceId) sn.invoiceId = invoiceId;
      if (invoiceNumber) sn.invoiceNumber = invoiceNumber;
    }
  }

  // --- CRITICAL INVENTORY CHECK ---
  public checkStockAvailability(productId: string, depotId: string, requestedQty: number): {
    available: boolean;
    availableAtDepot: number;
    totalStockAcrossAllDepots: number;
    alternativeDepots: { depotId: string; depotName: string; availableQty: number }[];
    productName: string;
  } {
    const product = this.getProductById(productId);
    if (!product) {
      return {
        available: false,
        availableAtDepot: 0,
        totalStockAcrossAllDepots: 0,
        alternativeDepots: [],
        productName: 'Unknown Product',
      };
    }
    const currentDepotQty = product.depotBreakdown?.[depotId] || 0;
    const totalQty = product.totalStock || 0;

    const alternatives: { depotId: string; depotName: string; availableQty: number }[] = [];
    if (product.depotBreakdown) {
      Object.entries(product.depotBreakdown).forEach(([dId, qty]) => {
        if (dId !== depotId && qty > 0) {
          const d = this.depots.find((dep) => dep.id === dId);
          if (d) {
            alternatives.push({ depotId: d.id, depotName: d.name, availableQty: qty });
          }
        }
      });
    }

    return {
      available: currentDepotQty >= requestedQty,
      availableAtDepot: currentDepotQty,
      totalStockAcrossAllDepots: totalQty,
      alternativeDepots: alternatives,
      productName: product.name,
    };
  }

  // --- STOCK TRANSFERS ---
  public getTransfers(): StockTransfer[] {
    return this.transfers;
  }

  public createTransfer(
    sourceDepotId: string,
    destinationDepotId: string,
    items: { productId: string; quantity: number; serialNumbers?: string[] }[],
    notes?: string
  ): StockTransfer {
    const sourceDepot = this.depots.find((d) => d.id === sourceDepotId);
    const destDepot = this.depots.find((d) => d.id === destinationDepotId);

    const fullItems = items.map((item) => {
      const p = this.getProductById(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);
      const srcQty = p.depotBreakdown?.[sourceDepotId] || 0;
      if (srcQty < item.quantity) {
        throw new Error(`Insufficient stock for ${p.name} at ${sourceDepot?.name}. Available: ${srcQty}, Requested: ${item.quantity}`);
      }

      // Deduct source and add to dest immediately (or mark in transit)
      if (!p.depotBreakdown) p.depotBreakdown = {};
      p.depotBreakdown[sourceDepotId] = (p.depotBreakdown[sourceDepotId] || 0) - item.quantity;
      p.depotBreakdown[destinationDepotId] = (p.depotBreakdown[destinationDepotId] || 0) + item.quantity;

      // Update serial numbers locations if any
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        item.serialNumbers.forEach((sNum) => {
          const snObj = this.serialNumbers.find((s) => s.serialNumber === sNum && s.productId === p.id);
          if (snObj) {
            snObj.depotId = destinationDepotId;
            snObj.depotName = destDepot?.name || 'Destination Depot';
          }
        });
      }

      return {
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        quantity: item.quantity,
        serialNumbers: item.serialNumbers,
      };
    });

    const transferNum = `TR-2026-${String(this.transfers.length + 1).padStart(3, '0')}`;
    const newTransfer: StockTransfer = {
      id: `tr-${Date.now()}`,
      transferNumber: transferNum,
      sourceDepotId,
      sourceDepotName: sourceDepot?.name || 'Source Depot',
      destinationDepotId,
      destinationDepotName: destDepot?.name || 'Destination Depot',
      items: fullItems,
      status: 'COMPLETED',
      notes,
      createdBy: this.currentUser.name,
      createdAt: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    };

    this.transfers.unshift(newTransfer);

    this.addAuditLog({
      action: 'STOCK_TRANSFER',
      entityType: 'TRANSFER',
      entityId: newTransfer.id,
      entityLabel: transferNum,
      description: `Transferred stock from ${sourceDepot?.name} to ${destDepot?.name} (${fullItems.map((i) => `${i.quantity}x ${i.productSku}`).join(', ')})`,
    });

    return newTransfer;
  }

  // --- STOCK ADJUSTMENT ---
  public adjustStock(
    productId: string,
    depotId: string,
    deltaQty: number,
    reason: StockAdjustment['reason'],
    notes?: string
  ): StockAdjustment {
    const product = this.products.find((p) => p.id === productId);
    const depot = this.depots.find((d) => d.id === depotId);
    if (!product || !depot) throw new Error('Invalid product or depot');

    if (!product.depotBreakdown) product.depotBreakdown = {};
    const prevQty = product.depotBreakdown[depotId] || 0;
    const newQty = prevQty + deltaQty;
    if (newQty < 0) {
      throw new Error(`Cannot adjust stock below 0. Current stock: ${prevQty}, requested adjustment: ${deltaQty}`);
    }
    product.depotBreakdown[depotId] = newQty;

    const adjustment: StockAdjustment = {
      id: `adj-${Date.now()}`,
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      depotId: depot.id,
      depotName: depot.name,
      deltaQty,
      previousQty: prevQty,
      newQty,
      reason,
      user: this.currentUser.name,
      notes,
      createdAt: new Date().toISOString(),
    };

    this.adjustments.unshift(adjustment);

    this.addAuditLog({
      action: 'STOCK_ADJUSTMENT',
      entityType: 'PRODUCT',
      entityId: product.id,
      entityLabel: `${product.sku} at ${depot.name}`,
      previousValue: `Qty: ${prevQty}`,
      newValue: `Qty: ${newQty} (${deltaQty > 0 ? '+' : ''}${deltaQty})`,
      description: `Stock adjusted by ${this.currentUser.name}: ${reason}. ${notes || ''}`,
    });

    return adjustment;
  }

  public getAdjustments(): StockAdjustment[] {
    return this.adjustments;
  }

  // --- CUSTOMERS ---
  public getCustomers(): Customer[] {
    return this.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id || c.customerCode.toLowerCase() === id.toLowerCase());
  }

  public createCustomer(data: Omit<Customer, 'id' | 'customerCode' | 'createdAt' | 'totalOrders' | 'totalSpent'>): Customer {
    const code = `CUST-${data.country.substring(0, 3).toUpperCase()}-${String(this.customers.length + 1).padStart(3, '0')}`;
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      customerCode: code,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    this.addAuditLog({
      action: 'LOGIN',
      entityType: 'CUSTOMER',
      entityId: newCustomer.id,
      entityLabel: `${newCustomer.companyName} (${code})`,
      description: `Created customer profile for ${newCustomer.companyName}`,
    });
    return newCustomer;
  }

  public updateCustomer(id: string, data: Partial<Customer>): Customer | null {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.customers[idx] = { ...this.customers[idx], ...data };
    return this.customers[idx];
  }

  // --- PROFORMAS ---
  public getProformas(): Proforma[] {
    return this.proformas;
  }

  public getProformaById(id: string): Proforma | undefined {
    return this.proformas.find((p) => p.id === id || p.proformaNumber.toLowerCase() === id.toLowerCase());
  }

  public createProforma(data: {
    customerId: string;
    items: {
      productId: string;
      quantity: number;
      unitPrice: number;
      discountPercent?: number;
      selectedDepotId?: string;
    }[];
    discountPercent?: number;
    shippingCost?: number;
    notes?: string;
    deliveryTerms?: string;
    paymentTerms?: string;
    expiryDays?: number;
  }): Proforma {
    const customer = this.getCustomerById(data.customerId);
    if (!customer) throw new Error('Customer not found');

    const nextNum = this.settings.proformaNextNumber;
    const proformaNum = `${this.settings.proformaPrefix}${String(nextNum).padStart(5, '0')}`;
    this.settings.proformaNextNumber += 1;

    let subtotal = 0;
    let totalTax = 0;

    const proformaItems = data.items.map((item, index) => {
      const p = this.getProductById(item.productId);
      if (!p) throw new Error(`Product ${item.productId} not found`);

      const itemDisc = item.discountPercent || 0;
      const itemSub = item.quantity * item.unitPrice * (1 - itemDisc / 100);
      const itemTax = itemSub * (p.taxRate / 100);
      const itemTotal = itemSub + itemTax;

      subtotal += item.quantity * item.unitPrice;
      totalTax += itemTax;

      const depot = item.selectedDepotId ? this.depots.find((d) => d.id === item.selectedDepotId) : undefined;

      return {
        id: `pfi-${Date.now()}-${index}`,
        productId: p.id,
        productSku: p.sku,
        productName: p.name,
        brand: p.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: itemDisc,
        taxRate: p.taxRate,
        taxAmount: Number(itemTax.toFixed(2)),
        totalPrice: Number(itemTotal.toFixed(2)),
        selectedDepotId: depot?.id,
        selectedDepotName: depot?.name,
        trackSerial: p.trackSerial,
      };
    });

    const discPercent = data.discountPercent || 0;
    const discAmount = subtotal * (discPercent / 100);
    const shipping = data.shippingCost || 0;
    const grandTotal = Number((subtotal - discAmount + totalTax + shipping).toFixed(2));

    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + (data.expiryDays || 15));
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    const newProforma: Proforma = {
      id: `pf-${Date.now()}`,
      proformaNumber: proformaNum,
      customerId: customer.id,
      customerName: customer.contactPerson,
      customerEmail: customer.email,
      customerCompany: customer.companyName,
      customerPhone: customer.phone,
      billingAddress: customer.billingAddress,
      shippingAddress: customer.shippingAddress,
      managerId: this.currentUser.id,
      managerName: this.currentUser.name,
      issueDate,
      expiryDate,
      paymentTerms: data.paymentTerms || this.settings.defaultPaymentTerms || 'NET 30',
      deliveryTerms: data.deliveryTerms || this.settings.defaultDeliveryTerms || 'Standard delivery',
      notes: data.notes,
      items: proformaItems,
      subtotal: Number(subtotal.toFixed(2)),
      discountPercent: discPercent,
      discountAmount: Number(discAmount.toFixed(2)),
      taxAmount: Number(totalTax.toFixed(2)),
      shippingCost: shipping,
      otherCharges: 0,
      grandTotal,
      currency: 'USD',
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.proformas.unshift(newProforma);

    this.addAuditLog({
      action: 'PROFORMA_CREATE',
      entityType: 'PROFORMA',
      entityId: newProforma.id,
      entityLabel: proformaNum,
      description: `Created Proforma ${proformaNum} for ${customer.companyName} (${formatUSD(grandTotal)})`,
    });

    return newProforma;
  }

  public updateProformaStatus(id: string, status: Proforma['status']): Proforma | null {
    const pf = this.proformas.find((p) => p.id === id);
    if (!pf) return null;
    const prev = pf.status;
    pf.status = status;
    pf.updatedAt = new Date().toISOString();

    this.addAuditLog({
      action: status === 'CONFIRMED' ? 'DEAL_CONFIRM' : 'PROFORMA_UPDATE',
      entityType: 'PROFORMA',
      entityId: pf.id,
      entityLabel: pf.proformaNumber,
      previousValue: `Status: ${prev}`,
      newValue: `Status: ${status}`,
      description: `Proforma ${pf.proformaNumber} status changed to ${status}`,
    });

    if (status === 'CONFIRMED') {
      this.addNotification({
        type: 'PROFORMA_CONFIRMED',
        title: `Deal Confirmed: ${pf.proformaNumber}`,
        message: `${pf.customerCompany} confirmed ${pf.proformaNumber} ($${pf.grandTotal.toLocaleString()}). Ready for 1-click Tax Invoice conversion.`,
        link: `/proformas/${pf.id}`,
        targetRole: 'MANAGER',
      });
    }

    return pf;
  }

  // --- 1-CLICK PROFORMA TO TAX INVOICE CONVERSION ENGINE ---
  public convertProformaToTaxInvoice(proformaId: string, assignedDepotId?: string): TaxInvoice {
    const pf = this.getProformaById(proformaId);
    if (!pf) throw new Error('Proforma not found');

    const defaultDepot = assignedDepotId
      ? this.depots.find((d) => d.id === assignedDepotId)
      : this.depots.find((d) => d.id === pf.items[0]?.selectedDepotId) || this.depots[0];

    if (!defaultDepot) throw new Error('No valid depot assigned');

    // CRITICAL INVENTORY CHECK: Verify stock for all items at assigned depot
    for (const item of pf.items) {
      const stockCheck = this.checkStockAvailability(item.productId, defaultDepot.id, item.quantity);
      if (!stockCheck.available) {
        throw new Error(
          `Insufficient stock at ${defaultDepot.name} for ${stockCheck.productName}. Required: ${item.quantity}, Available: ${stockCheck.availableAtDepot}.`
        );
      }
    }

    const nextNum = this.settings.invoiceNextNumber;
    const invoiceNum = `${this.settings.invoicePrefix}${String(nextNum).padStart(5, '0')}`;
    this.settings.invoiceNextNumber += 1;

    const issueDate = new Date().toISOString().split('T')[0];
    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + 30);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Allocate serial numbers and reserve stock
    const invoiceItems: TaxInvoice['items'] = pf.items.map((item, idx) => {
      const allocatedSerials: string[] = [];
      if (item.trackSerial) {
        const availableSerials = this.serialNumbers.filter(
          (s) => s.productId === item.productId && s.depotId === defaultDepot.id && s.status === 'IN_STOCK'
        );
        for (let i = 0; i < Math.min(item.quantity, availableSerials.length); i++) {
          availableSerials[i].status = 'ALLOCATED';
          availableSerials[i].invoiceId = `inv-${Date.now()}`;
          availableSerials[i].invoiceNumber = invoiceNum;
          allocatedSerials.push(availableSerials[i].serialNumber);
        }
      }

      // Deduct from depot inventory
      const product = this.products.find((p) => p.id === item.productId);
      if (product && product.depotBreakdown && product.depotBreakdown[defaultDepot.id]) {
        product.depotBreakdown[defaultDepot.id] -= item.quantity;
      }

      return {
        id: `ivi-${Date.now()}-${idx}`,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        brand: item.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        totalPrice: item.totalPrice,
        depotId: defaultDepot.id,
        depotName: defaultDepot.name,
        allocatedSerials,
        trackSerial: !!item.trackSerial,
        isPicked: false,
      };
    });

    const newInvoice: TaxInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      proformaId: pf.id,
      proformaNumber: pf.proformaNumber,
      customerId: pf.customerId,
      customerName: pf.customerName,
      customerEmail: pf.customerEmail,
      customerCompany: pf.customerCompany,
      customerPhone: pf.customerPhone,
      billingAddress: pf.billingAddress,
      shippingAddress: pf.shippingAddress,
      depotId: defaultDepot.id,
      depotName: defaultDepot.name,
      managerId: pf.managerId || this.currentUser.id,
      managerName: pf.managerName || this.currentUser.name,
      issueDate,
      dueDate,
      paymentTerms: pf.paymentTerms,
      paymentStatus: 'UNPAID',
      fulfilmentStatus: 'READY_FOR_PACKING',
      items: invoiceItems,
      subtotal: pf.subtotal,
      discountAmount: pf.discountAmount,
      taxAmount: pf.taxAmount,
      shippingCost: pf.shippingCost,
      otherCharges: pf.otherCharges,
      grandTotal: pf.grandTotal,
      currency: 'USD',
      notes: pf.notes,
      internalRemarks: `Converted automatically from Proforma ${pf.proformaNumber}. Assigned to ${defaultDepot.name}.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update Proforma Status to CONVERTED
    pf.status = 'CONVERTED';
    pf.convertedToInvoiceId = newInvoice.id;
    pf.convertedToInvoiceNumber = newInvoice.invoiceNumber;
    pf.convertedAt = new Date().toISOString();

    // Update Customer Statistics
    const customer = this.customers.find((c) => c.id === pf.customerId);
    if (customer) {
      customer.totalOrders = (customer.totalOrders || 0) + 1;
      customer.totalSpent = (customer.totalSpent || 0) + newInvoice.grandTotal;
      customer.currentBalance = (customer.currentBalance || 0) + newInvoice.grandTotal;
    }

    this.invoices.unshift(newInvoice);

    // Auto-create cloud document entry for invoice
    this.addCloudDocument({
      title: `Tax Invoice ${invoiceNum} (${pf.customerCompany})`,
      fileName: `Tax_Invoice_${invoiceNum}.pdf`,
      fileType: 'application/pdf',
      fileFormat: 'pdf',
      fileSize: 180000,
      cloudinaryUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      cloudinaryPublicId: `camera-erp-dev2/documents/${invoiceNum.toLowerCase()}`,
      category: 'TAX_INVOICE',
      relatedEntityType: 'INVOICE',
      relatedEntityId: newInvoice.id,
      relatedEntityLabel: `Invoice #${invoiceNum}`,
      tags: ['Tax Invoice', pf.customerCompany, `USD ${newInvoice.grandTotal.toFixed(2)}`],
    });

    this.addAuditLog({
      action: 'CONVERT_TO_INVOICE',
      entityType: 'INVOICE',
      entityId: newInvoice.id,
      entityLabel: invoiceNum,
      description: `Manager ${this.currentUser.name} converted Proforma ${pf.proformaNumber} into Tax Invoice ${invoiceNum} -> Dispatched to ${defaultDepot.name}`,
    });

    // Send high-priority notification to Depot Users
    this.addNotification({
      type: 'DEPOT_PACKING_PENDING',
      title: `New Fulfilment Task: ${invoiceNum}`,
      message: `Tax Invoice ${invoiceNum} for ${pf.customerCompany} is ready for picking and packing at ${defaultDepot.name}.`,
      link: `/invoices/${newInvoice.id}`,
      targetRole: 'DEPOT_USER',
      targetDepotId: defaultDepot.id,
    });

    return newInvoice;
  }

  // --- TAX INVOICES ---
  public getInvoices(depotId?: string): TaxInvoice[] {
    if (depotId) {
      return this.invoices.filter((i) => i.depotId === depotId);
    }
    return this.invoices;
  }

  public getInvoiceById(id: string): TaxInvoice | undefined {
    return this.invoices.find((i) => i.id === id || i.invoiceNumber.toLowerCase() === id.toLowerCase());
  }

  public updateInvoicePayment(id: string, paymentStatus: TaxInvoice['paymentStatus']): TaxInvoice | null {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) return null;
    inv.paymentStatus = paymentStatus;
    inv.updatedAt = new Date().toISOString();
    return inv;
  }

  // --- DEPOT PICKING & PACKING WORKFLOW ---
  public pickInvoiceItems(invoiceId: string, itemPicks: { itemId: string; serials?: string[] }[]): TaxInvoice | null {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) {
      this.addAuditLog({
        action: 'ORDER_PICKED',
        entityType: 'INVOICE',
        entityId: invoiceId,
        entityLabel: `Invoice #${invoiceId}`,
        description: `Items picked by ${this.currentUser.name}`,
      });
      return null;
    }

    itemPicks.forEach((pick) => {
      const item = inv.items?.find((it) => it.id === pick.itemId);
      if (item) {
        item.isPicked = true;
        if (pick.serials && pick.serials.length > 0) {
          item.allocatedSerials = pick.serials;
          // update serial status
          pick.serials.forEach((sn) => {
            this.updateSerialStatus(sn, 'ALLOCATED', inv.id, inv.invoiceNumber);
          });
        }
      }
    });

    inv.fulfilmentStatus = 'PROCESSING';
    inv.updatedAt = new Date().toISOString();

    this.addAuditLog({
      action: 'ORDER_PICKED',
      entityType: 'INVOICE',
      entityId: inv.id,
      entityLabel: inv.invoiceNumber,
      description: `Items picked at ${inv.depotName} by ${this.currentUser.name}`,
    });

    return inv;
  }

  public packInvoice(
    invoiceId: string,
    packingData: {
      packedBy: string;
      packageCount: number;
      totalWeightKg: number;
      dimensionsCm: { length: number; width: number; height: number };
      packagePhotoUrl?: string;
      notes?: string;
    }
  ): TaxInvoice | null {
    const inv = this.getInvoiceById(invoiceId);

    // Auto-create packing list document if package photo provided
    if (packingData.packagePhotoUrl) {
      this.addCloudDocument({
        title: `Package Inspection Photo - ${inv?.invoiceNumber || invoiceId}`,
        fileName: `Package_${inv?.invoiceNumber || invoiceId}.jpg`,
        fileType: 'image/jpeg',
        fileFormat: 'jpg',
        fileSize: 450000,
        cloudinaryUrl: packingData.packagePhotoUrl,
        category: 'PACKING_LIST',
        relatedEntityType: 'INVOICE',
        relatedEntityId: invoiceId,
        relatedEntityLabel: `Invoice #${inv?.invoiceNumber || invoiceId}`,
        tags: ['Packed Box', inv?.customerCompany || 'Wholesale Client', `${packingData.totalWeightKg}kg`],
      });
    }

    this.addAuditLog({
      action: 'ORDER_PACKED',
      entityType: 'INVOICE',
      entityId: invoiceId,
      entityLabel: inv?.invoiceNumber || invoiceId,
      description: `Order ${inv?.invoiceNumber || invoiceId} packed by ${packingData.packedBy} (${packingData.packageCount} boxes, ${packingData.totalWeightKg} kg)`,
    });

    if (!inv) return null;

    inv.fulfilmentStatus = 'PACKED';
    inv.updatedAt = new Date().toISOString();
    return inv;
  }

  // --- SHIPPING & AIRWAY BILL DISPATCH ---
  public dispatchShipment(
    invoiceId: string,
    shippingData: {
      courier: Shipment['courier'];
      customCourierName?: string;
      airwayBillNumber: string;
      trackingUrl: string;
      shippingCost: number;
      weightKg: number;
      packageCount: number;
      dimensionsCm?: { length: number; width: number; height: number };
      airwayBillDocUrl?: string;
      packagePhotoUrl?: string;
    }
  ): Shipment {
    const inv = this.getInvoiceById(invoiceId);

    const shipmentNum = `SHP-2026-${String(this.shipments.length + 1).padStart(5, '0')}`;
    const now = new Date().toISOString();
    const estDateObj = new Date();
    estDateObj.setDate(estDateObj.getDate() + 4);

    const newShipment: Shipment = {
      id: `shp-${Date.now()}`,
      shipmentNumber: shipmentNum,
      invoiceId: invoiceId,
      invoiceNumber: inv?.invoiceNumber || invoiceId,
      customerId: inv?.customerId || 'cust-direct',
      customerName: inv?.customerName || 'Wholesale Client',
      customerCompany: inv?.customerCompany || 'Commercial Wholesale Customer',
      destinationCountry: inv?.billingAddress?.includes('UAE') ? 'United Arab Emirates' : 'International',
      shippingAddress: inv?.shippingAddress || 'Consignee Delivery Depot',
      depotId: inv?.depotId || 'dep-dxb',
      depotName: inv?.depotName || 'Dubai Logistics Hub',
      courier: shippingData.courier,
      customCourierName: shippingData.customCourierName,
      airwayBillNumber: shippingData.airwayBillNumber,
      trackingUrl: shippingData.trackingUrl,
      shippingDate: now,
      estimatedDeliveryDate: estDateObj.toISOString(),
      shippingCost: shippingData.shippingCost,
      weightKg: shippingData.weightKg,
      packageCount: shippingData.packageCount,
      dimensionsCm: shippingData.dimensionsCm,
      airwayBillDocUrl: shippingData.airwayBillDocUrl,
      packagePhotoUrl: shippingData.packagePhotoUrl,
      status: 'DISPATCHED',
      packedBy: this.currentUser.name,
      dispatchedBy: this.currentUser.name,
      createdAt: now,
      updatedAt: now,
    };

    this.shipments.unshift(newShipment);

    if (inv) {
      // Update invoice status to SHIPPED
      inv.fulfilmentStatus = 'SHIPPED';
      inv.shipmentId = newShipment.id;
      inv.updatedAt = now;

      // Update allocated serial numbers to DISPATCHED
      (inv.items || []).forEach((item) => {
        (item.allocatedSerials || []).forEach((sn) => {
          this.updateSerialStatus(sn, 'DISPATCHED', inv.id, inv.invoiceNumber);
        });
      });
    }

    // If Airway Bill doc was uploaded to Cloudinary, register in documents hub
    if (shippingData.airwayBillDocUrl) {
      this.addCloudDocument({
        title: `Airway Bill ${shippingData.airwayBillNumber} (${inv?.customerCompany || 'Customer'})`,
        fileName: `AWB_${shippingData.airwayBillNumber}.pdf`,
        fileType: 'application/pdf',
        fileFormat: 'pdf',
        fileSize: 320000,
        cloudinaryUrl: shippingData.airwayBillDocUrl,
        category: 'AIRWAY_BILL',
        relatedEntityType: 'SHIPMENT',
        relatedEntityId: newShipment.id,
        relatedEntityLabel: `Shipment #${shipmentNum} (AWB: ${shippingData.airwayBillNumber})`,
        tags: ['Airway Bill', shippingData.courier, inv?.customerCompany || 'Customer'],
      });
    }

    this.addAuditLog({
      action: 'SHIPMENT_DISPATCHED',
      entityType: 'SHIPMENT',
      entityId: newShipment.id,
      entityLabel: `${shipmentNum} (${shippingData.airwayBillNumber})`,
      description: `Dispatched order ${inv?.invoiceNumber || invoiceId} via ${shippingData.courier} with Airway Bill ${shippingData.airwayBillNumber}`,
    });

    this.addNotification({
      type: 'SHIPMENT_DISPATCHED',
      title: `Order Shipped: ${inv?.invoiceNumber || invoiceId}`,
      message: `Shipment #${shipmentNum} dispatched via ${shippingData.courier}. AWB: ${shippingData.airwayBillNumber}.`,
      link: `/shipments/${newShipment.id}`,
      targetRole: 'SUPER_ADMIN',
    });

    return newShipment;
  }

  // --- SHIPMENTS ---
  public getShipments(): Shipment[] {
    return this.shipments;
  }

  public getShipmentById(id: string): Shipment | undefined {
    return this.shipments.find((s) => s.id === id || s.shipmentNumber.toLowerCase() === id.toLowerCase());
  }

  public updateShipmentStatus(id: string, status: Shipment['status']): Shipment | null {
    const s = this.shipments.find((shp) => shp.id === id);
    if (!s) return null;
    s.status = status;
    s.updatedAt = new Date().toISOString();
    if (status === 'DELIVERED') {
      s.actualDeliveryDate = new Date().toISOString();
      const inv = this.invoices.find((i) => i.id === s.invoiceId);
      if (inv) {
        inv.fulfilmentStatus = 'DELIVERED';
      }
      this.addAuditLog({
        action: 'SHIPMENT_DELIVERED',
        entityType: 'SHIPMENT',
        entityId: s.id,
        entityLabel: s.shipmentNumber,
        description: `Shipment ${s.shipmentNumber} (AWB: ${s.airwayBillNumber}) marked as DELIVERED to ${s.customerCompany}`,
      });
    }
    return s;
  }

  // --- CLOUD DOCUMENTS HUB ---
  public getDocuments(filter?: { category?: string; entityType?: string; entityId?: string; search?: string }): CloudDocument[] {
    return this.documents.filter((doc) => {
      if (filter?.category && filter.category !== 'ALL' && doc.category !== filter.category) return false;
      if (filter?.entityType && doc.relatedEntityType !== filter.entityType) return false;
      if (filter?.entityId && doc.relatedEntityId !== filter.entityId) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        const match =
          doc.title.toLowerCase().includes(q) ||
          doc.fileName.toLowerCase().includes(q) ||
          doc.relatedEntityLabel.toLowerCase().includes(q) ||
          doc.tags?.some((t) => t.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  public addCloudDocument(data: Omit<CloudDocument, 'id' | 'uploadedBy' | 'uploadedByName' | 'uploadedAt'>): CloudDocument {
    const newDoc: CloudDocument = {
      ...data,
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedBy: this.currentUser.id,
      uploadedByName: this.currentUser.name,
      uploadedAt: new Date().toISOString(),
    };
    this.documents.unshift(newDoc);
    this.addAuditLog({
      action: 'DOCUMENT_UPLOAD',
      entityType: 'DOCUMENT',
      entityId: newDoc.id,
      entityLabel: newDoc.title,
      description: `Uploaded document ${newDoc.fileName} (${newDoc.category}) to Cloudinary`,
    });
    return newDoc;
  }

  public deleteCloudDocument(id: string): boolean {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    const doc = this.documents[idx];
    this.documents.splice(idx, 1);
    this.addAuditLog({
      action: 'DOCUMENT_UPLOAD',
      entityType: 'DOCUMENT',
      entityId: id,
      entityLabel: doc.title,
      description: `Deleted document ${doc.fileName}`,
    });
    return true;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(entry: {
    action: AuditLog['action'];
    entityType: string;
    entityId: string;
    entityLabel: string;
    previousValue?: string;
    newValue?: string;
    description: string;
  }) {
    const log: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userRole: this.currentUser.role,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityLabel: entry.entityLabel,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      description: entry.description,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  // --- NOTIFICATIONS ---
  public getNotifications(role?: UserRole, depotId?: string): Notification[] {
    return this.notifications.filter((n) => {
      if (role && n.targetRole && n.targetRole !== role) return false;
      if (depotId && n.targetDepotId && n.targetDepotId !== depotId) return false;
      return true;
    });
  }

  public addNotification(n: Omit<Notification, 'id' | 'read' | 'createdAt'>): Notification {
    const newNotif: Notification = {
      ...n,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  public markNotificationAsRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }

  public markAllNotificationsAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  // --- COMPANY SETTINGS ---
  public getCompanySettings(): CompanySettings {
    return this.settings;
  }

  public updateCompanySettings(s: Partial<CompanySettings>): CompanySettings {
    this.settings = { ...this.settings, ...s };
    return this.settings;
  }

  // --- PROFITABILITY & BUSINESS INTELLIGENCE ENGINE ---
  public getProfitabilityMetrics(): ProfitabilityMetric[] {
    const metrics: Record<string, ProfitabilityMetric> = {};

    this.products.forEach((p) => {
      metrics[p.id] = {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        brand: p.brand,
        categoryName: p.categoryName || 'General',
        unitsSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        averageSellingPrice: p.sellingPrice,
        averagePurchasePrice: p.purchasePrice,
      };
    });

    // Aggregate from all Invoices
    this.invoices.forEach((inv) => {
      if (inv.fulfilmentStatus !== 'CANCELLED') {
        inv.items.forEach((item) => {
          const m = metrics[item.productId];
          if (m) {
            const product = this.products.find((p) => p.id === item.productId);
            const unitCost = product ? product.purchasePrice : item.unitPrice * 0.75;
            const revenue = item.quantity * item.unitPrice;
            const cost = item.quantity * unitCost;

            m.unitsSold += item.quantity;
            m.totalRevenue += revenue;
            m.totalCost += cost;
            m.grossProfit += revenue - cost;
          }
        });
      }
    });

    return Object.values(metrics).map((m) => ({
      ...m,
      grossMarginPercent: m.totalRevenue > 0 ? Number(((m.grossProfit / m.totalRevenue) * 100).toFixed(1)) : 0,
    }));
  }

  public getBusinessInsights(): BusinessInsight[] {
    const metrics = this.getProfitabilityMetrics();
    const insights: BusinessInsight[] = [];

    // 1. Margin leader
    const soldItems = metrics.filter((m) => m.unitsSold > 0).sort((a, b) => b.grossProfit - a.grossProfit);
    if (soldItems.length > 0) {
      const top = soldItems[0];
      insights.push({
        id: 'bi-margin-leader',
        type: 'MARGIN_LEADER',
        title: `${top.productName} is your #1 Gross Margin Generator`,
        message: `Generated ${formatUSD(top.grossProfit)} in gross profit with a ${top.grossMarginPercent}% profit margin across ${top.unitsSold} units sold this month.`,
        urgency: 'SUCCESS',
        metricValue: formatUSD(top.grossProfit),
        actionLink: `/products/${top.productId}`,
        actionLabel: 'View Product Details',
      });
    }

    // 2. Low stock warning
    const lowStockProducts = this.getProducts().filter((p) => (p.totalStock || 0) <= p.minStockLevel);
    if (lowStockProducts.length > 0) {
      insights.push({
        id: 'bi-low-stock',
        type: 'LOW_STOCK_WARNING',
        title: `${lowStockProducts.length} high-velocity camera models are below minimum threshold`,
        message: `${lowStockProducts.map((p) => p.sku).slice(0, 3).join(', ')} require inventory replenishment or purchase order creation immediately.`,
        urgency: 'ALERT',
        metricValue: `${lowStockProducts.length} Items Low`,
        actionLink: '/inventory',
        actionLabel: 'Check Depot Stock',
      });
    }

    // 3. Top customer revenue contribution
    const topCustomer = this.customers.slice().sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))[0];
    if (topCustomer) {
      insights.push({
        id: 'bi-top-cust',
        type: 'TOP_CUSTOMER',
        title: `${topCustomer.companyName} generated ${formatUSD(topCustomer.totalSpent)} in total volume`,
        message: `Accounts for largest wholesale order volume across UAE and Middle East cinema rental partners. Credit limit utilization: ${(
          ((topCustomer.currentBalance || 0) / topCustomer.creditLimit) *
          100
        ).toFixed(0)}%.`,
        urgency: 'INFO',
        metricValue: formatUSD(topCustomer.totalSpent),
        actionLink: `/customers/${topCustomer.id}`,
        actionLabel: 'Open Customer 360',
      });
    }

    // 4. Dead stock detection
    insights.push({
      id: 'bi-dead-stock',
      type: 'DEAD_STOCK_ALERT',
      title: 'Nikon Z8 accessories have remained in Bangalore Depot for >75 days',
      message: 'Consider bundling with full-frame camera kits or applying a 4% wholesale promotional discount to accelerate inventory turnover.',
      urgency: 'WARNING',
      metricValue: '75+ Days Unsold',
      actionLink: '/inventory/transfers',
      actionLabel: 'Initiate Transfer',
    });

    return insights;
  }

  // --- GLOBAL SEARCH ENGINE ---
  public searchGlobal(query: string): {
    category: string;
    title: string;
    subtitle: string;
    link: string;
    badge?: string;
  }[] {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase().trim();
    const results: { category: string; title: string; subtitle: string; link: string; badge?: string }[] = [];

    // Search Invoices
    this.invoices.forEach((inv) => {
      if (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerCompany.toLowerCase().includes(q) ||
        inv.proformaNumber?.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'Tax Invoices',
          title: inv.invoiceNumber,
          subtitle: `${inv.customerCompany} • ${formatUSD(inv.grandTotal)} • ${inv.fulfilmentStatus}`,
          link: `/invoices/${inv.id}`,
          badge: inv.fulfilmentStatus,
        });
      }
    });

    // Search Proformas
    this.proformas.forEach((pf) => {
      if (pf.proformaNumber.toLowerCase().includes(q) || pf.customerCompany.toLowerCase().includes(q)) {
        results.push({
          category: 'Proforma Invoices',
          title: pf.proformaNumber,
          subtitle: `${pf.customerCompany} • ${formatUSD(pf.grandTotal)} • ${pf.status}`,
          link: `/proformas/${pf.id}`,
          badge: pf.status,
        });
      }
    });

    // Search Products
    this.products.forEach((p) => {
      if (
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'Products & Inventory',
          title: `${p.name} (${p.sku})`,
          subtitle: `${p.brand} • Stock: ${p.totalStock} units • ${formatUSD(p.sellingPrice)}`,
          link: `/products/${p.id}`,
          badge: p.brand,
        });
      }
    });

    // Search Serial Numbers
    this.serialNumbers.forEach((sn) => {
      if (sn.serialNumber.toLowerCase().includes(q)) {
        results.push({
          category: 'Serial Numbers',
          title: `Serial: ${sn.serialNumber}`,
          subtitle: `${sn.productName} • Location: ${sn.depotName} • Status: ${sn.status}`,
          link: `/inventory/serials`,
          badge: sn.status,
        });
      }
    });

    // Search Customers
    this.customers.forEach((c) => {
      if (
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'Customers',
          title: c.companyName,
          subtitle: `${c.contactPerson} • ${c.country} • Balance: ${formatUSD(c.currentBalance)}`,
          link: `/customers/${c.id}`,
          badge: c.customerCode,
        });
      }
    });

    // Search Shipments / Airway Bills
    this.shipments.forEach((shp) => {
      if (
        shp.airwayBillNumber.toLowerCase().includes(q) ||
        shp.shipmentNumber.toLowerCase().includes(q) ||
        shp.customerCompany.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'Shipments & Airway Bills',
          title: `AWB: ${shp.airwayBillNumber}`,
          subtitle: `${shp.courier} • ${shp.customerCompany} • ${shp.status}`,
          link: `/shipments/${shp.id}`,
          badge: shp.courier,
        });
      }
    });

    // Search Cloud Documents
    this.documents.forEach((doc) => {
      if (
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.relatedEntityLabel.toLowerCase().includes(q)
      ) {
        results.push({
          category: 'Cloud Documents',
          title: doc.title,
          subtitle: `${doc.category} • ${doc.fileName} • ${doc.uploadedByName}`,
          link: `/documents?search=${encodeURIComponent(doc.fileName)}`,
          badge: doc.category,
        });
      }
    });

    return results.slice(0, 15);
  }
}

// Global Singleton Instance
declare global {
  var __cameraErpStore: DataStore | undefined;
}

export const dataStore: DataStore = globalThis.__cameraErpStore || new DataStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__cameraErpStore = dataStore;
}

export default dataStore;
