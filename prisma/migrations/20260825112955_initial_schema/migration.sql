-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'DEPOT_USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SerialStatus" AS ENUM ('IN_STOCK', 'ALLOCATED', 'DISPATCHED', 'RETURNED', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('STOCK_IN', 'STOCK_TRANSFER', 'STOCK_ADJUSTMENT', 'SALE_DISPATCH', 'RETURN');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('DAMAGED', 'CYCLE_COUNT', 'FOUND', 'DEFECTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentTerms" AS ENUM ('NET_15', 'NET_30', 'NET_60', 'IMMEDIATE', 'ADVANCE_50', 'CASH_IN_ADVANCE');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'ON_HOLD', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ProformaStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoicePaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID');

-- CreateEnum
CREATE TYPE "InvoiceFulfilmentStatus" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'PROCESSING', 'READY_FOR_PACKING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CourierProvider" AS ENUM ('DHL_EXPRESS', 'FEDEX_INTERNATIONAL', 'ARAMEX', 'EMIRATES_SKYCARGO', 'UPS', 'OTHER');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('READY', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('AIRWAY_BILL', 'TAX_INVOICE', 'PROFORMA', 'PACKING_PHOTO', 'INSPECTION_REPORT', 'CUSTOMS_DOC', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DEPOT_USER',
    "assignedDepotId" TEXT,
    "assignedDepotName" TEXT,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Depot" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isCentralHub" BOOLEAN NOT NULL DEFAULT false,
    "activeOrdersCount" INTEGER NOT NULL DEFAULT 0,
    "totalStockUnits" INTEGER NOT NULL DEFAULT 0,
    "totalStockValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Depot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "productCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT,
    "subcategory" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    "barcode" TEXT NOT NULL,
    "trackSerial" BOOLEAN NOT NULL DEFAULT true,
    "purchasePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "wholesalePrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "minStockLevel" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialNumber" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "depotName" TEXT NOT NULL,
    "status" "SerialStatus" NOT NULL DEFAULT 'IN_STOCK',
    "invoiceId" TEXT,
    "invoiceNumber" TEXT,
    "historyJson" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerialNumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepotInventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "allocatedQuantity" INTEGER NOT NULL DEFAULT 0,
    "availableQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepotInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "sourceDepotId" TEXT,
    "sourceDepotName" TEXT,
    "targetDepotId" TEXT,
    "targetDepotName" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referenceNumber" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransfer" (
    "id" TEXT NOT NULL,
    "transferNumber" TEXT NOT NULL,
    "sourceDepotId" TEXT NOT NULL,
    "sourceDepotName" TEXT NOT NULL,
    "destinationDepotId" TEXT NOT NULL,
    "destinationDepotName" TEXT NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'System',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3),

    CONSTRAINT "StockTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferItem" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "serialNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "StockTransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "depotName" TEXT NOT NULL,
    "deltaQty" INTEGER NOT NULL,
    "previousQty" INTEGER NOT NULL,
    "newQty" INTEGER NOT NULL,
    "reason" "AdjustmentReason" NOT NULL DEFAULT 'CYCLE_COUNT',
    "user" TEXT NOT NULL DEFAULT 'Manager',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "billingAddress" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'United Arab Emirates',
    "taxNumber" TEXT NOT NULL DEFAULT 'TAX-PENDING',
    "paymentTerms" "PaymentTerms" NOT NULL DEFAULT 'NET_30',
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 50000,
    "currentBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "taxId" TEXT,
    "paymentTerms" TEXT NOT NULL DEFAULT 'NET_30',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proforma" (
    "id" TEXT NOT NULL,
    "proformaNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerCompany" TEXT NOT NULL,
    "customerPhone" TEXT,
    "billingAddress" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "managerId" TEXT NOT NULL DEFAULT 'usr-mgr',
    "managerName" TEXT NOT NULL DEFAULT 'Marcus Vance',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT 'NET 30 days from dispatch',
    "deliveryTerms" TEXT NOT NULL DEFAULT 'Air Freight via Courier (CIF)',
    "notes" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ProformaStatus" NOT NULL DEFAULT 'DRAFT',
    "convertedToInvoiceId" TEXT,
    "convertedToInvoiceNumber" TEXT,
    "convertedAt" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proforma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProformaItem" (
    "id" TEXT NOT NULL,
    "proformaId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'Canon',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "selectedDepotId" TEXT,
    "selectedDepotName" TEXT,
    "trackSerial" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProformaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "proformaId" TEXT,
    "proformaNumber" TEXT,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerCompany" TEXT NOT NULL,
    "customerPhone" TEXT,
    "billingAddress" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "depotName" TEXT NOT NULL,
    "managerId" TEXT NOT NULL DEFAULT 'usr-mgr',
    "managerName" TEXT NOT NULL DEFAULT 'Marcus Vance',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentTerms" TEXT NOT NULL DEFAULT 'NET 30 days from dispatch',
    "paymentStatus" "InvoicePaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "fulfilmentStatus" "InvoiceFulfilmentStatus" NOT NULL DEFAULT 'READY_FOR_PACKING',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherCharges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grandTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "internalRemarks" TEXT,
    "shipmentId" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL DEFAULT 'Canon',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depotId" TEXT NOT NULL,
    "depotName" TEXT NOT NULL,
    "allocatedSerials" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trackSerial" BOOLEAN NOT NULL DEFAULT true,
    "isPicked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackingDetails" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "packedBy" TEXT NOT NULL,
    "packedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packageCount" INTEGER NOT NULL DEFAULT 1,
    "totalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "lengthCm" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "widthCm" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "heightCm" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "boxNumber" TEXT,
    "packagePhotoUrl" TEXT,
    "packingNotes" TEXT,

    CONSTRAINT "PackingDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipmentNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerCompany" TEXT NOT NULL,
    "destinationCountry" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "depotId" TEXT NOT NULL,
    "depotName" TEXT NOT NULL,
    "courier" "CourierProvider" NOT NULL DEFAULT 'DHL_EXPRESS',
    "customCourierName" TEXT,
    "airwayBillNumber" TEXT NOT NULL,
    "trackingUrl" TEXT NOT NULL DEFAULT '',
    "status" "ShipmentStatus" NOT NULL DEFAULT 'DISPATCHED',
    "totalWeightKg" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "packageCount" INTEGER NOT NULL DEFAULT 1,
    "dispatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "awbDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloudDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "cloudinaryPublicId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL DEFAULT 'OTHER',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "relatedEntityLabel" TEXT,
    "uploadedBy" TEXT NOT NULL DEFAULT 'usr-admin',
    "uploadedByName" TEXT NOT NULL DEFAULT 'Admin User',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "CloudDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" "UserRole" NOT NULL DEFAULT 'DEPOT_USER',
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityLabel" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL DEFAULT '127.0.0.1',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '/dashboard',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "targetRole" "UserRole",
    "targetDepotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL DEFAULT 'global-settings',
    "companyName" TEXT NOT NULL DEFAULT 'GROWTH BRIDGE',
    "tradingName" TEXT NOT NULL DEFAULT 'Growth Bridge',
    "logoUrl" TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200',
    "taxRegistrationNumber" TEXT NOT NULL DEFAULT 'VAT-99201-US-GLOBAL',
    "vatGstNumber" TEXT NOT NULL DEFAULT 'TRN-100889218200001',
    "companyAddress" TEXT NOT NULL DEFAULT 'Office 402, Business Bay, Dubai, UAE',
    "phone" TEXT NOT NULL DEFAULT '+91 62827 59863',
    "email" TEXT NOT NULL DEFAULT 'contact@growthbridge.com',
    "website" TEXT NOT NULL DEFAULT 'https://growthbridge.com',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "currencySymbol" TEXT NOT NULL DEFAULT '$',
    "bankName" TEXT NOT NULL DEFAULT 'Commercial Bank of Dubai, Sheikh Zayed Road Branch, Dubai, U.A.E.',
    "accountName" TEXT NOT NULL DEFAULT 'Arib Global General Trading LLC',
    "accountNumber" TEXT NOT NULL DEFAULT 'AE910230000001002416343',
    "swiftBic" TEXT NOT NULL DEFAULT 'CBOUAEADXXX',
    "iban" TEXT NOT NULL DEFAULT 'AE91 0230 0000 0100 2416 343',
    "routingCode" TEXT NOT NULL DEFAULT 'CBD-0230',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-2026-',
    "proformaPrefix" TEXT NOT NULL DEFAULT 'PF-2026-',
    "invoiceNextNumber" INTEGER NOT NULL DEFAULT 3,
    "proformaNextNumber" INTEGER NOT NULL DEFAULT 3,
    "defaultPaymentTerms" TEXT NOT NULL DEFAULT 'Cash In Advance',
    "defaultDeliveryTerms" TEXT NOT NULL DEFAULT 'C&F Vietnam Airport',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_assignedDepotId_idx" ON "User"("assignedDepotId");

-- CreateIndex
CREATE UNIQUE INDEX "Depot_code_key" ON "Depot"("code");

-- CreateIndex
CREATE INDEX "Depot_country_idx" ON "Depot"("country");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_barcode_idx" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "SerialNumber_serialNumber_key" ON "SerialNumber"("serialNumber");

-- CreateIndex
CREATE INDEX "SerialNumber_productId_idx" ON "SerialNumber"("productId");

-- CreateIndex
CREATE INDEX "SerialNumber_depotId_idx" ON "SerialNumber"("depotId");

-- CreateIndex
CREATE INDEX "SerialNumber_status_idx" ON "SerialNumber"("status");

-- CreateIndex
CREATE INDEX "SerialNumber_serialNumber_idx" ON "SerialNumber"("serialNumber");

-- CreateIndex
CREATE INDEX "DepotInventory_depotId_idx" ON "DepotInventory"("depotId");

-- CreateIndex
CREATE INDEX "DepotInventory_productId_idx" ON "DepotInventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "DepotInventory_productId_depotId_key" ON "DepotInventory"("productId", "depotId");

-- CreateIndex
CREATE INDEX "StockTransaction_productId_idx" ON "StockTransaction"("productId");

-- CreateIndex
CREATE INDEX "StockTransaction_type_idx" ON "StockTransaction"("type");

-- CreateIndex
CREATE INDEX "StockTransaction_createdAt_idx" ON "StockTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransfer_transferNumber_key" ON "StockTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "StockTransfer_status_idx" ON "StockTransfer"("status");

-- CreateIndex
CREATE INDEX "StockTransfer_transferNumber_idx" ON "StockTransfer"("transferNumber");

-- CreateIndex
CREATE INDEX "StockTransferItem_transferId_idx" ON "StockTransferItem"("transferId");

-- CreateIndex
CREATE INDEX "StockAdjustment_productId_idx" ON "StockAdjustment"("productId");

-- CreateIndex
CREATE INDEX "StockAdjustment_depotId_idx" ON "StockAdjustment"("depotId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_customerCode_idx" ON "Customer"("customerCode");

-- CreateIndex
CREATE INDEX "Customer_companyName_idx" ON "Customer"("companyName");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Proforma_proformaNumber_key" ON "Proforma"("proformaNumber");

-- CreateIndex
CREATE INDEX "Proforma_proformaNumber_idx" ON "Proforma"("proformaNumber");

-- CreateIndex
CREATE INDEX "Proforma_customerId_idx" ON "Proforma"("customerId");

-- CreateIndex
CREATE INDEX "Proforma_status_idx" ON "Proforma"("status");

-- CreateIndex
CREATE INDEX "ProformaItem_proformaId_idx" ON "ProformaItem"("proformaId");

-- CreateIndex
CREATE INDEX "ProformaItem_productId_idx" ON "ProformaItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxInvoice_invoiceNumber_key" ON "TaxInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "TaxInvoice_invoiceNumber_idx" ON "TaxInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "TaxInvoice_customerId_idx" ON "TaxInvoice"("customerId");

-- CreateIndex
CREATE INDEX "TaxInvoice_depotId_idx" ON "TaxInvoice"("depotId");

-- CreateIndex
CREATE INDEX "TaxInvoice_fulfilmentStatus_idx" ON "TaxInvoice"("fulfilmentStatus");

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PackingDetails_invoiceId_key" ON "PackingDetails"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_shipmentNumber_key" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_invoiceId_key" ON "Shipment"("invoiceId");

-- CreateIndex
CREATE INDEX "Shipment_shipmentNumber_idx" ON "Shipment"("shipmentNumber");

-- CreateIndex
CREATE INDEX "Shipment_airwayBillNumber_idx" ON "Shipment"("airwayBillNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "CloudDocument_category_idx" ON "CloudDocument"("category");

-- CreateIndex
CREATE INDEX "CloudDocument_relatedEntityId_idx" ON "CloudDocument"("relatedEntityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_targetRole_idx" ON "Notification"("targetRole");

-- CreateIndex
CREATE INDEX "Notification_targetDepotId_idx" ON "Notification"("targetDepotId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedDepotId_fkey" FOREIGN KEY ("assignedDepotId") REFERENCES "Depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialNumber" ADD CONSTRAINT "SerialNumber_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "TaxInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepotInventory" ADD CONSTRAINT "DepotInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepotInventory" ADD CONSTRAINT "DepotInventory_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "StockTransfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferItem" ADD CONSTRAINT "StockTransferItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proforma" ADD CONSTRAINT "Proforma_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaItem" ADD CONSTRAINT "ProformaItem_proformaId_fkey" FOREIGN KEY ("proformaId") REFERENCES "Proforma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProformaItem" ADD CONSTRAINT "ProformaItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxInvoice" ADD CONSTRAINT "TaxInvoice_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "TaxInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackingDetails" ADD CONSTRAINT "PackingDetails_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "TaxInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "TaxInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
