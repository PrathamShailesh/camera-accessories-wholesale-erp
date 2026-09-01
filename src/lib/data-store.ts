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

// Clean Initial Single Depot Infrastructure
const INITIAL_DEPOTS: Depot[] = [
  {
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
];

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'System Administrator',
    email: 'admin@aribglobal.com',
    role: 'SUPER_ADMIN',
    avatar: '',
    phone: '+971 4 800 0100',
    status: 'ACTIVE',
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'usr-depot',
    name: 'Depot Manager',
    email: 'depot@aribglobal.com',
    role: 'DEPOT_USER',
    assignedDepotId: 'dep-central',
    assignedDepotName: 'Central Depot',
    avatar: '',
    phone: '+971 4 800 0100',
    status: 'ACTIVE',
    lastLogin: new Date().toISOString(),
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
  private users: User[] = INITIAL_USERS;
  private depots: Depot[] = INITIAL_DEPOTS;
  private categories: Category[] = INITIAL_CATEGORIES;
  private products: Product[] = INITIAL_PRODUCTS;
  private serialNumbers: SerialNumber[] = INITIAL_SERIAL_NUMBERS;
  private customers: Customer[] = INITIAL_CUSTOMERS;
  private proformas: Proforma[] = INITIAL_PROFORMAS;
  private invoices: TaxInvoice[] = INITIAL_INVOICES;
  private shipments: Shipment[] = INITIAL_SHIPMENTS;
  private documents: CloudDocument[] = INITIAL_DOCUMENTS;
  private transfers: StockTransfer[] = INITIAL_TRANSFERS;
  private adjustments: StockAdjustment[] = INITIAL_ADJUSTMENTS;
  private auditLogs: AuditLog[] = INITIAL_AUDIT_LOGS;
  private notifications: Notification[] = INITIAL_NOTIFICATIONS;
  private companySettings: CompanySettings = INITIAL_COMPANY_SETTINGS;

  private currentUserId: string = 'usr-admin';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedUser = localStorage.getItem('erp_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.id) this.currentUserId = parsed.id;
      }
    } catch {}
  }

  // --- USERS & AUTH ---
  public getUsers(): User[] {
    return this.users;
  }

  public getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public getCurrentUser(): User {
    return this.getUserById(this.currentUserId) || this.users[0];
  }

  public setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  public updateUser(id: string, data: Partial<User>): User | null {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, data);
    return user;
  }

  public addAuditLog(entry: Partial<AuditLog>): void {
    const log: AuditLog = {
      id: `log-${Date.now()}`,
      userId: this.currentUserId,
      userName: this.getCurrentUser()?.name || 'System User',
      userRole: this.getCurrentUser()?.role || 'SUPER_ADMIN',
      action: entry.action || 'USER_PERMISSION_CHANGE',
      entityType: entry.entityType || 'USER',
      entityId: entry.entityId || '',
      entityLabel: entry.entityLabel || '',
      description: entry.description || '',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  // --- DEPOTS ---
  public getDepots(): Depot[] {
    return this.depots;
  }

  public getDepotById(id: string): Depot | undefined {
    return this.depots.find((d) => d.id === id);
  }

  // --- PRODUCTS & INVENTORY ---
  public getProducts(): Product[] {
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.find((p) => p.id === id);
  }

  public createProduct(data: any): Product {
    const p: Product = {
      id: data.id || `prod-${Date.now()}`,
      sku: data.sku,
      name: data.name,
      brand: data.brand,
      model: data.model || '',
      categoryId: data.categoryId || 'cat-1',
      categoryName: data.categoryName || 'General Equipment',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      barcode: data.barcode || data.sku,
      trackSerial: data.trackSerial ?? true,
      purchasePrice: data.purchasePrice || 0,
      wholesalePrice: data.wholesalePrice || 0,
      sellingPrice: data.sellingPrice || data.wholesalePrice || 0,
      taxRate: data.taxRate || 5,
      minStockLevel: data.minStockLevel || 10,
      totalStock: data.totalStock || 0,
      status: data.status || 'ACTIVE',
      depotBreakdown: data.depotBreakdown || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.products.unshift(p);
    return p;
  }

  public updateProduct(id: string, data: Partial<Product>): Product | null {
    const p = this.getProductById(id);
    if (!p) return null;
    Object.assign(p, data);
    return p;
  }

  public getCategories(): Category[] {
    return this.categories;
  }

  public getSerialNumbers(productId?: string): SerialNumber[] {
    if (productId) {
      return this.serialNumbers.filter((s) => s.productId === productId);
    }
    return this.serialNumbers;
  }

  // --- CUSTOMERS ---
  public getCustomers(): Customer[] {
    return this.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  public createCustomer(data: any): Customer {
    const c: Customer = {
      id: data.id || `cust-${Date.now()}`,
      customerCode: data.customerCode || `CUST-${Date.now()}`,
      companyName: data.companyName,
      contactPerson: data.contactPerson,
      email: data.email,
      phone: data.phone || '',
      billingAddress: data.billingAddress || '',
      shippingAddress: data.shippingAddress || data.billingAddress || '',
      country: data.country || 'UAE',
      taxNumber: data.taxNumber || '',
      paymentTerms: data.paymentTerms || 'NET_30',
      creditLimit: data.creditLimit || 50000,
      currentBalance: data.currentBalance || 0,
      totalOrders: data.totalOrders || 0,
      totalSpent: data.totalSpent || 0,
      notes: data.notes || '',
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(c);
    return c;
  }

  public updateCustomer(id: string, data: Partial<Customer>): Customer | null {
    const c = this.getCustomerById(id);
    if (!c) return null;
    Object.assign(c, data);
    return c;
  }

  // --- PROFORMAS ---
  public getProformas(filter?: { status?: string; customerId?: string }): Proforma[] {
    let result = [...this.proformas];
    if (filter?.status && filter.status !== 'ALL') {
      result = result.filter((p) => p.status === filter.status);
    }
    if (filter?.customerId) {
      result = result.filter((p) => p.customerId === filter.customerId);
    }
    return result;
  }

  public getProformaById(id: string): Proforma | undefined {
    return this.proformas.find((p) => p.id === id);
  }

  public createProforma(data: any): Proforma {
    const p: Proforma = {
      id: data.id || `pf-${Date.now()}`,
      proformaNumber: data.proformaNumber || `PF-${Date.now()}`,
      customerId: data.customerId,
      customerName: data.customerName,
      customerCompany: data.customerCompany,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || '',
      billingAddress: data.billingAddress || '',
      shippingAddress: data.shippingAddress || '',
      managerId: data.managerId || 'usr-admin',
      managerName: data.managerName || 'System Admin',
      status: data.status || 'DRAFT',
      issueDate: data.issueDate || new Date().toISOString(),
      expiryDate: data.expiryDate || data.validUntil || new Date(Date.now() + 14 * 86400000).toISOString(),
      currency: 'USD',
      subtotal: data.subtotal || 0,
      discountPercent: data.discountPercent || 0,
      discountAmount: data.discountAmount || 0,
      taxAmount: data.taxAmount || 0,
      shippingCost: data.shippingCost || 0,
      otherCharges: data.otherCharges || 0,
      grandTotal: data.grandTotal || 0,
      items: data.items || [],
      notes: data.notes || '',
      paymentTerms: data.paymentTerms || 'Cash In Advance',
      deliveryTerms: data.deliveryTerms || 'C&F Vietnam Airport',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.proformas.unshift(p);
    return p;
  }

  public updateProforma(id: string, data: Partial<Proforma>): Proforma | null {
    const p = this.getProformaById(id);
    if (!p) return null;
    Object.assign(p, data);
    return p;
  }

  // --- INVOICES ---
  public getInvoices(filter?: { status?: string; customerId?: string; depotId?: string }): TaxInvoice[] {
    let result = [...this.invoices];
    if (filter?.status && filter.status !== 'ALL') {
      result = result.filter((i) => i.fulfilmentStatus === filter.status);
    }
    if (filter?.customerId) {
      result = result.filter((i) => i.customerId === filter.customerId);
    }
    if (filter?.depotId) {
      result = result.filter((i) => i.depotId === filter.depotId);
    }
    return result;
  }

  public getInvoiceById(id: string): TaxInvoice | undefined {
    return this.invoices.find((i) => i.id === id);
  }

  public createInvoice(data: any): TaxInvoice {
    const inv: TaxInvoice = {
      id: data.id || `inv-${Date.now()}`,
      invoiceNumber: data.invoiceNumber || `INV-${Date.now()}`,
      proformaId: data.proformaId,
      proformaNumber: data.proformaNumber,
      customerId: data.customerId,
      customerName: data.customerName,
      customerCompany: data.customerCompany,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone || '',
      billingAddress: data.billingAddress || '',
      shippingAddress: data.shippingAddress || '',
      depotId: data.depotId || 'dep-central',
      depotName: data.depotName || 'Central Depot',
      managerId: data.managerId || 'usr-admin',
      managerName: data.managerName || 'System Admin',
      fulfilmentStatus: data.fulfilmentStatus || 'READY_FOR_PACKING',
      paymentStatus: data.paymentStatus || 'UNPAID',
      issueDate: data.issueDate || new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      paymentTerms: data.paymentTerms || 'Cash In Advance',
      currency: 'USD',
      subtotal: data.subtotal || 0,
      discountAmount: data.discountAmount || 0,
      taxAmount: data.taxAmount || 0,
      shippingCost: data.shippingCost || 0,
      otherCharges: data.otherCharges || 0,
      grandTotal: data.grandTotal || 0,
      items: data.items || [],
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.invoices.unshift(inv);
    return inv;
  }

  public updateInvoice(id: string, data: Partial<TaxInvoice>): TaxInvoice | null {
    const inv = this.getInvoiceById(id);
    if (!inv) return null;
    Object.assign(inv, data);
    return inv;
  }

  // --- SHIPMENTS ---
  public getShipments(): Shipment[] {
    return this.shipments;
  }

  public getShipmentById(id: string): Shipment | undefined {
    return this.shipments.find((s) => s.id === id);
  }

  public getTransfers(): StockTransfer[] {
    return this.transfers;
  }

  public getAdjustments(): StockAdjustment[] {
    return this.adjustments;
  }

  // --- DOCUMENTS ---
  public getDocuments(filter?: { category?: string; entityId?: string }): CloudDocument[] {
    let result = [...this.documents];
    if (filter?.category && filter.category !== 'ALL') {
      result = result.filter((d) => d.category === filter.category);
    }
    if (filter?.entityId) {
      result = result.filter((d) => d.relatedEntityId === filter.entityId);
    }
    return result;
  }

  // --- AUDIT LOGS & NOTIFICATIONS ---
  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public getNotifications(userRole?: UserRole, depotId?: string): Notification[] {
    return this.notifications.filter((n) => {
      if (n.targetRole && n.targetRole !== userRole && userRole !== 'SUPER_ADMIN') return false;
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
    return this.companySettings;
  }

  public updateCompanySettings(settings: Partial<CompanySettings>): CompanySettings {
    this.companySettings = { ...this.companySettings, ...settings };
    return this.companySettings;
  }

  // --- FULFILMENT WORKFLOW ACTIONS ---
  public pickInvoiceItems(invoiceId: string, itemIds: string[]): boolean {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) return false;
    inv.fulfilmentStatus = 'PROCESSING';
    return true;
  }

  public packInvoice(invoiceId: string): boolean {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) return false;
    inv.fulfilmentStatus = 'PACKED';
    return true;
  }

  public dispatchShipment(invoiceId: string): boolean {
    const inv = this.getInvoiceById(invoiceId);
    if (!inv) return false;
    inv.fulfilmentStatus = 'SHIPPED';
    return true;
  }

  // --- DASHBOARD AGGREGATED STATS ---
  public getDashboardOverview() {
    const totalRevenue = this.invoices
      .filter((i) => i.fulfilmentStatus !== 'CANCELLED')
      .reduce((sum, i) => sum + i.grandTotal, 0);

    const totalCost = this.invoices
      .filter((i) => i.fulfilmentStatus !== 'CANCELLED')
      .reduce((sum, i) => {
        const invCost = (i.items || []).reduce((itemSum, item) => itemSum + (item.unitPrice * 0.78) * item.quantity, 0);
        return sum + invCost;
      }, 0);

    const grossProfit = totalRevenue - totalCost;
    const pendingProformas = this.proformas.filter((p) => p.status === 'SENT' || p.status === 'DRAFT').length;
    const pendingShipments = this.invoices.filter(
      (i) => i.fulfilmentStatus === 'READY_FOR_PACKING' || i.fulfilmentStatus === 'PROCESSING' || i.fulfilmentStatus === 'PACKED'
    ).length;

    return {
      revenue: totalRevenue,
      grossProfit,
      totalOrders: this.invoices.length,
      inventoryValue: this.products.reduce((sum, p) => sum + (p.totalStock || 0) * p.wholesalePrice, 0),
      pendingProformas,
      pendingShipments,
    };
  }

  public searchGlobal(query: string) {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return {
        products: this.products.slice(0, 5),
        customers: this.customers.slice(0, 5),
        proformas: this.proformas.slice(0, 5),
        invoices: this.invoices.slice(0, 5),
      };
    }
    return {
      products: this.products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)),
      customers: this.customers.filter((c) => c.companyName.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)),
      proformas: this.proformas.filter((p) => p.proformaNumber.toLowerCase().includes(q) || p.customerCompany.toLowerCase().includes(q)),
      invoices: this.invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerCompany.toLowerCase().includes(q)),
    };
  }
}

const dataStore = new DataStore();
export default dataStore;
