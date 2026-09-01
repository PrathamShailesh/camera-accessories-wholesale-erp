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

// Clean Dataset for Client Handover - Basic Infrastructure Only
const INITIAL_DEPOTS: Depot[] = [
  {
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
  {
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
  {
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
  {
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

const INITIAL_CATEGORIES: Category[] = [];

const INITIAL_PRODUCTS: Product[] = [];

const INITIAL_SERIAL_NUMBERS: SerialNumber[] = [];

const INITIAL_CUSTOMERS: Customer[] = [];

const INITIAL_PROFORMAS: Proforma[] = [];

const INITIAL_INVOICES: TaxInvoice[] = [];

const INITIAL_SHIPMENTS: Shipment[] = [];

const INITIAL_DOCUMENTS: CloudDocument[] = [];

const INITIAL_TRANSFERS: StockTransfer[] = [];

const INITIAL_ADJUSTMENTS: StockAdjustment[] = [];

const INITIAL_AUDIT_LOGS: AuditLog[] = [];

const INITIAL_NOTIFICATIONS: Notification[] = [];

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
  invoiceNextNumber: 1,
  proformaNextNumber: 1,
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
      previousValue: JSON.stringify({ role: prev.role, status: prev.status }),
      newValue: JSON.stringify({ role: updated.role, status: updated.status }),
      description: `Updated user ${updated.name}`,
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
    return this.depots;
  }

  public getDepotById(id: string): Depot | undefined {
    return this.depots.find((d) => d.id === id);
  }

  public createDepot(data: Omit<Depot, 'id'>): Depot {
    const id = `dep-${Date.now()}`;
    const newDepot: Depot = {
      ...data,
      id,
      activeOrdersCount: 0,
      totalStockUnits: 0,
      totalStockValue: 0,
    };
    this.depots.push(newDepot);
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'DEPOT',
      entityId: newDepot.id,
      entityLabel: newDepot.name,
      description: `Created depot ${newDepot.name}`,
    });
    return newDepot;
  }

  public updateDepot(id: string, data: Partial<Depot>): Depot | null {
    const idx = this.depots.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const updated = { ...this.depots[idx], ...data, updatedAt: new Date().toISOString() };
    this.depots[idx] = updated;
    return updated;
  }

  public deleteDepot(id: string): boolean {
    const idx = this.depots.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    const depot = this.depots[idx];
    this.depots.splice(idx, 1);
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'DEPOT',
      entityId: id,
      entityLabel: depot.name,
      description: `Deleted depot ${depot.name}`,
    });
    return true;
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return this.categories;
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categories.find((c) => c.id === id);
  }

  public createCategory(data: Omit<Category, 'id'>): Category {
    const id = `cat-${Date.now()}`;
    const newCategory: Category = {
      ...data,
      id,
      productCount: 0,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  public updateCategory(id: string, data: Partial<Category>): Category | null {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...this.categories[idx], ...data };
    this.categories[idx] = updated;
    return updated;
  }

  public deleteCategory(id: string): boolean {
    const idx = this.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.categories.splice(idx, 1);
    return true;
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public getProductBySku(sku: string): Product | undefined {
    return this.products.find((p) => p.sku === sku);
  }

  public createProduct(data: Omit<Product, 'id'>): Product {
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...data,
      id,
      totalStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.push(newProduct);
    this.addAuditLog({
      action: 'PRICE_UPDATE',
      entityType: 'PRODUCT',
      entityId: newProduct.id,
      entityLabel: newProduct.name,
      description: `Created product ${newProduct.name}`,
    });
    return newProduct;
  }

  public updateProduct(id: string, data: Partial<Product>): Product | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = { ...this.products[idx], ...data, updatedAt: new Date().toISOString() };
    this.products[idx] = updated;
    return updated;
  }

  public deleteProduct(id: string): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const product = this.products[idx];
    this.products.splice(idx, 1);
    this.addAuditLog({
      action: 'PRICE_UPDATE',
      entityType: 'PRODUCT',
      entityId: id,
      entityLabel: product.name,
      description: `Deleted product ${product.name}`,
    });
    return true;
  }

  // --- CUSTOMERS ---
  public getCustomers(): Customer[] {
    return this.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public createCustomer(data: Omit<Customer, 'id'>): Customer {
    const id = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...data,
      id,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    this.customers.push(newCustomer);
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'CUSTOMER',
      entityId: newCustomer.id,
      entityLabel: newCustomer.companyName,
      description: `Created customer ${newCustomer.companyName}`,
    });
    return newCustomer;
  }

  public updateCustomer(id: string, data: Partial<Customer>): Customer | null {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    const updated = { ...this.customers[idx], ...data };
    this.customers[idx] = updated;
    return updated;
  }

  public deleteCustomer(id: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const customer = this.customers[idx];
    this.customers.splice(idx, 1);
    this.addAuditLog({
      action: 'USER_PERMISSION_CHANGE',
      entityType: 'CUSTOMER',
      entityId: id,
      entityLabel: customer.companyName,
      description: `Deleted customer ${customer.companyName}`,
    });
    return true;
  }

  // --- PROFORMAS ---
  public getProformas(): Proforma[] {
    return this.proformas;
  }

  public getProformaById(id: string): Proforma | undefined {
    return this.proformas.find((p) => p.id === id);
  }

  public getProformaByNumber(number: string): Proforma | undefined {
    return this.proformas.find((p) => p.proformaNumber === number);
  }

  public createProforma(data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number; discountPercent?: number }>;
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

      subtotal += itemSub;
      totalTax += itemTax;

      return {
        id: `pfi-${Date.now()}-${index}`,
        proformaId: '', // Will be set after proforma creation
        productId: item.productId,
        productSku: p.sku,
        productName: p.name,
        brand: p.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: itemDisc,
        taxRate: p.taxRate,
        taxAmount: itemTax,
        totalPrice: itemTotal,
        selectedDepotId: undefined,
        selectedDepotName: undefined,
        trackSerial: p.trackSerial,
      };
    });

    const discPercent = data.discountPercent || 0;
    const discAmount = subtotal * (discPercent / 100);
    const shipping = data.shippingCost || 0;
    const grandTotal = subtotal - discAmount + totalTax + shipping;

    const issueDate = new Date().toISOString().split('T')[0];
    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + (data.expiryDays || 30));
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    const proforma: Proforma = {
      id: `pf-${Date.now()}`,
      proformaNumber: proformaNum,
      customerId: data.customerId,
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

    // Set proformaId on items
    proforma.items = proforma.items.map((item) => ({ ...item, proformaId: proforma.id }));

    this.proformas.push(proforma);
    this.addAuditLog({
      action: 'PROFORMA_UPDATE',
      entityType: 'PROFORMA',
      entityId: proforma.id,
      entityLabel: proforma.proformaNumber,
      description: `Created proforma ${proforma.proformaNumber} for ${customer.companyName}`,
    });

    return proforma;
  }

  public updateProforma(id: string, data: Partial<Proforma>): Proforma | null {
    const idx = this.proformas.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const updated = { ...this.proformas[idx], ...data };
    this.proformas[idx] = updated;
    return updated;
  }

  public deleteProforma(id: string): boolean {
    const idx = this.proformas.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const proforma = this.proformas[idx];
    this.proformas.splice(idx, 1);
    this.addAuditLog({
      action: 'PROFORMA_UPDATE',
      entityType: 'PROFORMA',
      entityId: id,
      entityLabel: proforma.proformaNumber,
      description: `Deleted proforma ${proforma.proformaNumber}`,
    });
    return true;
  }

  // --- INVOICES ---
  public getInvoices(depotId?: string): TaxInvoice[] {
    if (!depotId) return this.invoices;
    return this.invoices.filter((i) => i.depotId === depotId);
  }

  public getInvoiceById(id: string): TaxInvoice | undefined {
    return this.invoices.find((i) => i.id === id);
  }

  public getInvoiceByNumber(number: string): TaxInvoice | undefined {
    return this.invoices.find((i) => i.invoiceNumber === number);
  }

  public convertProformaToInvoice(proformaId: string): TaxInvoice {
    const pf = this.getProformaById(proformaId);
    if (!pf) throw new Error('Proforma not found');
    if (pf.status !== 'CONFIRMED') throw new Error('Proforma must be confirmed before conversion');

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
        // For now, just placeholder serial allocation
        allocatedSerials.push(`SN-${Date.now()}-${idx}`);
      }

      return {
        id: `inv-i-${Date.now()}-${idx}`,
        invoiceId: '', // Will be set after invoice creation
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        brand: item.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        totalPrice: item.totalPrice,
        depotId: '', // Will be assigned later
        depotName: '',
        allocatedSerials,
        trackSerial: item.trackSerial || false,
        isPicked: false,
      };
    });

    const invoice: TaxInvoice = {
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
      depotId: '', // Will be assigned later
      depotName: '',
      managerId: this.currentUser.id,
      managerName: this.currentUser.name,
      issueDate,
      dueDate,
      paymentTerms: pf.paymentTerms,
      paymentStatus: 'UNPAID',
      fulfilmentStatus: 'READY_FOR_PACKING',
      subtotal: pf.subtotal,
      discountAmount: pf.discountAmount,
      taxAmount: pf.taxAmount,
      shippingCost: pf.shippingCost,
      otherCharges: pf.otherCharges,
      grandTotal: pf.grandTotal,
      currency: pf.currency,
      notes: pf.notes,
      internalRemarks: '',
      shipmentId: undefined,
      items: invoiceItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Set invoiceId on items
    invoice.items = invoice.items.map((item) => ({ ...item, invoiceId: invoice.id }));

    // Update proforma status
    this.updateProforma(pf.id, {
      status: 'CONVERTED',
      convertedToInvoiceId: invoice.id,
      convertedToInvoiceNumber: invoice.invoiceNumber,
      convertedAt: new Date().toISOString(),
    });

    this.invoices.push(invoice);
    this.addAuditLog({
      action: 'CONVERT_TO_INVOICE',
      entityType: 'INVOICE',
      entityId: invoice.id,
      entityLabel: invoice.invoiceNumber,
      description: `Converted proforma ${pf.proformaNumber} to invoice ${invoice.invoiceNumber}`,
    });

    return invoice;
  }

  public updateInvoice(id: string, data: Partial<TaxInvoice>): TaxInvoice | null {
    const idx = this.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const updated = { ...this.invoices[idx], ...data, updatedAt: new Date().toISOString() };
    this.invoices[idx] = updated;
    return updated;
  }

  public deleteInvoice(id: string): boolean {
    const idx = this.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    const invoice = this.invoices[idx];
    this.invoices.splice(idx, 1);
    this.addAuditLog({
      action: 'CONVERT_TO_INVOICE',
      entityType: 'INVOICE',
      entityId: id,
      entityLabel: invoice.invoiceNumber,
      description: `Deleted invoice ${invoice.invoiceNumber}`,
    });
    return true;
  }

  // --- SERIAL NUMBERS ---
  public getSerialNumbers(productId?: string): SerialNumber[] {
    if (!productId) return this.serialNumbers;
    return this.serialNumbers.filter((s) => s.productId === productId);
  }

  public getSerialNumbersByProduct(productId: string): SerialNumber[] {
    return this.serialNumbers.filter((s) => s.productId === productId);
  }

  public getSerialNumbersByDepot(depotId: string): SerialNumber[] {
    return this.serialNumbers.filter((s) => s.depotId === depotId);
  }

  public createSerialNumber(data: Omit<SerialNumber, 'id'>): SerialNumber {
    const id = `sn-${Date.now()}`;
    const newSerial: SerialNumber = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.serialNumbers.push(newSerial);
    return newSerial;
  }

  public updateSerialNumber(id: string, data: Partial<SerialNumber>): SerialNumber | null {
    const idx = this.serialNumbers.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = { ...this.serialNumbers[idx], ...data };
    this.serialNumbers[idx] = updated;
    return updated;
  }

  public deleteSerialNumber(id: string): boolean {
    const idx = this.serialNumbers.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.serialNumbers.splice(idx, 1);
    return true;
  }

  // --- STOCK TRANSFERS ---
  public getTransfers(): StockTransfer[] {
    return this.transfers;
  }

  public getTransferById(id: string): StockTransfer | undefined {
    return this.transfers.find((t) => t.id === id);
  }

  public createTransfer(sourceDepotId: string, destDepotId: string, items: { productId: string; quantity: number }[], notes: string): void {
    // Fallback method that delegates to createStockTransfer
    const sourceDepot = this.getDepotById(sourceDepotId);
    const destDepot = this.getDepotById(destDepotId);
    if (!sourceDepot || !destDepot) return;

    this.createStockTransfer({
      sourceDepotId,
      sourceDepotName: sourceDepot.name,
      destinationDepotId: destDepotId,
      destinationDepotName: destDepot.name,
      items: items.map((item) => {
        const product = this.getProductById(item.productId);
        return {
          productId: item.productId,
          productSku: product?.sku || '',
          productName: product?.name || '',
          quantity: item.quantity,
          serialNumbers: [],
        };
      }),
      notes: notes || undefined,
    });
  }

  public createStockTransfer(data: {
    sourceDepotId: string;
    sourceDepotName: string;
    destinationDepotId: string;
    destinationDepotName: string;
    items: Array<{ productId: string; productSku: string; productName: string; quantity: number; serialNumbers: string[] }>;
    notes?: string;
  }): StockTransfer {
    const id = `tr-${Date.now()}`;
    const transferNumber = `TR-${new Date().getFullYear()}-${String(this.transfers.length + 1).padStart(4, '0')}`;

    const transfer: StockTransfer = {
      id,
      transferNumber,
      sourceDepotId: data.sourceDepotId,
      sourceDepotName: data.sourceDepotName,
      destinationDepotId: data.destinationDepotId,
      destinationDepotName: data.destinationDepotName,
      status: 'PENDING',
      notes: data.notes || undefined,
      createdBy: this.currentUser.name,
      createdAt: new Date().toISOString(),
      receivedAt: undefined,
      items: data.items.map((item, idx) => ({
        id: `tri-${Date.now()}-${idx}`,
        transferId: id,
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        quantity: item.quantity,
        serialNumbers: item.serialNumbers,
      })),
    };

    this.transfers.push(transfer);
    this.addAuditLog({
      action: 'STOCK_TRANSFER',
      entityType: 'STOCK_TRANSFER',
      entityId: transfer.id,
      entityLabel: transfer.transferNumber,
      description: `Created stock transfer ${transfer.transferNumber}`,
    });

    return transfer;
  }

  public updateStockTransfer(id: string, data: Partial<StockTransfer>): StockTransfer | null {
    const idx = this.transfers.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const updated = { ...this.transfers[idx], ...data };
    this.transfers[idx] = updated;
    return updated;
  }

  // --- STOCK ADJUSTMENTS ---
  public getAdjustments(): StockAdjustment[] {
    return this.adjustments;
  }

  public createStockAdjustment(data: {
    productId: string;
    productSku: string;
    productName: string;
    depotId: string;
    depotName: string;
    deltaQty: number;
    previousQty: number;
    newQty: number;
    reason: string;
    notes?: string;
  }): StockAdjustment {
    const id = `adj-${Date.now()}`;
    const adjustment: StockAdjustment = {
      id,
      productId: data.productId,
      productSku: data.productSku,
      productName: data.productName,
      depotId: data.depotId,
      depotName: data.depotName,
      deltaQty: data.deltaQty,
      previousQty: data.previousQty,
      newQty: data.newQty,
      reason: data.reason as any,
      user: this.currentUser.name,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    this.adjustments.push(adjustment);
    this.addAuditLog({
      action: 'STOCK_ADJUSTMENT',
      entityType: 'STOCK_ADJUSTMENT',
      entityId: adjustment.id,
      entityLabel: `${data.productName} at ${data.depotName}`,
      description: `Stock adjustment: ${data.deltaQty > 0 ? '+' : ''}${data.deltaQty} units`,
    });

    return adjustment;
  }

  // --- SHIPMENTS ---
  public getShipments(filter?: { depotId?: string }): Shipment[] {
    if (!filter) return this.shipments;
    return this.shipments.filter((s) => {
      if (filter.depotId && s.depotId !== filter.depotId) return false;
      return true;
    });
  }

  public getShipmentById(id: string): Shipment | undefined {
    return this.shipments.find((s) => s.id === id);
  }

  public createShipment(data: Omit<Shipment, 'id'>): Shipment {
    const id = `shp-${Date.now()}`;
    const shipmentNumber = `SHP-${new Date().getFullYear()}-${String(this.shipments.length + 1).padStart(4, '0')}`;

    const shipment: Shipment = {
      ...data,
      id,
      shipmentNumber,
      status: 'READY',
      dispatchedBy: this.currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.shipments.push(shipment);
    this.addAuditLog({
      action: 'SHIPMENT_DISPATCHED',
      entityType: 'SHIPMENT',
      entityId: shipment.id,
      entityLabel: shipment.shipmentNumber,
      description: `Created shipment ${shipment.shipmentNumber}`,
    });

    return shipment;
  }

  public updateShipment(id: string, data: Partial<Shipment>): Shipment | null {
    const idx = this.shipments.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    const updated = { ...this.shipments[idx], ...data };
    this.shipments[idx] = updated;
    return updated;
  }

  // --- DOCUMENTS ---
  public getDocuments(filter?: { entityId?: string }): CloudDocument[] {
    if (!filter) return this.documents;
    return this.documents.filter((d) => {
      if (filter.entityId && d.relatedEntityId !== filter.entityId) return false;
      return true;
    });
  }

  public createDocument(data: Omit<CloudDocument, 'id'>): CloudDocument {
    const id = `doc-${Date.now()}`;
    const document: CloudDocument = {
      ...data,
      id,
      uploadedBy: this.currentUser.id,
      uploadedByName: this.currentUser.name,
      uploadedAt: new Date().toISOString(),
    };

    this.documents.push(document);
    return document;
  }

  public deleteDocument(id: string): boolean {
    const idx = this.documents.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    return true;
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public addAuditLog(data: Omit<AuditLog, 'id' | 'timestamp' | 'userId' | 'userName' | 'userRole'>): void {
    const log: AuditLog = {
      id: `aud-${Date.now()}`,
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userRole: this.currentUser.role as UserRole,
      timestamp: new Date().toISOString(),
      ...data,
    };
    this.auditLogs.push(log);
  }

  // --- NOTIFICATIONS ---
  public getNotifications(role?: string, depotId?: string): Notification[] {
    if (!role && !depotId) return this.notifications;
    return this.notifications.filter((n) => {
      if (n.targetRole && role && n.targetRole !== role) return false;
      if (n.targetDepotId && depotId && n.targetDepotId !== depotId) return false;
      return true;
    });
  }

  public markNotificationAsRead(id: string): void {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }

  public markAllNotificationsAsRead(): void {
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
        categoryName: p.categoryName || 'Uncategorized',
        unitsSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        grossProfit: 0,
        grossMarginPercent: 0,
        averageSellingPrice: 0,
        averagePurchasePrice: 0,
      };
    });

    return Object.values(metrics);
  }

  public getBusinessInsights(): BusinessInsight[] {
    const insights: BusinessInsight[] = [];

    // Low stock alerts
    this.products.forEach((p) => {
      const totalStock = p.totalStock || 0;
      const minStockLevel = p.minStockLevel || 0;
      if (totalStock <= minStockLevel) {
        insights.push({
          id: `insight-${p.id}`,
          type: 'LOW_STOCK_WARNING',
          urgency: 'WARNING',
          title: `Low Stock Alert: ${p.name}`,
          message: `Only ${totalStock} units remaining (Minimum: ${minStockLevel})`,
        });
      }
    });

    return insights;
  }

  // --- SEARCH FUNCTIONALITY ---
  public search(query: string): {
    products: Product[];
    customers: Customer[];
    invoices: TaxInvoice[];
    proformas: Proforma[];
  } {
    const lowerQuery = query.toLowerCase();

    return {
      products: this.products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.sku.toLowerCase().includes(lowerQuery) ||
          p.brand.toLowerCase().includes(lowerQuery)
      ),
      customers: this.customers.filter(
        (c) =>
          c.companyName.toLowerCase().includes(lowerQuery) ||
          c.contactPerson.toLowerCase().includes(lowerQuery) ||
          c.email.toLowerCase().includes(lowerQuery)
      ),
      invoices: this.invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(lowerQuery) ||
          i.customerCompany.toLowerCase().includes(lowerQuery)
      ),
      proformas: this.proformas.filter(
        (p) =>
          p.proformaNumber.toLowerCase().includes(lowerQuery) ||
          p.customerCompany.toLowerCase().includes(lowerQuery)
      ),
    };
  }

  public searchGlobal(query: string): {
    products: Product[];
    customers: Customer[];
    invoices: TaxInvoice[];
    proformas: Proforma[];
  } {
    return this.search(query);
  }

  // --- STOCK ADJUSTMENT ---
  public adjustStock(data: {
    productId: string;
    depotId: string;
    deltaQty: number;
    reason: string;
    notes?: string;
  }): StockAdjustment | null {
    return null; // Not implemented in memory store
  }

  // --- INVOICE OPERATIONS ---
  public pickInvoiceItems(invoiceId: string, itemIds: string[]): TaxInvoice | null {
    return null; // Not implemented in memory store
  }

  public packInvoice(invoiceId: string): TaxInvoice | null {
    return null; // Not implemented in memory store
  }

  public dispatchShipment(shipmentId: string): Shipment | null {
    return null; // Not implemented in memory store
  }
}

// Singleton instance
const dataStore = new DataStore();

export default dataStore;
