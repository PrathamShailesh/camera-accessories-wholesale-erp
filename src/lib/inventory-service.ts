import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';

export interface PurchaseItem {
  productId: string;
  productSku?: string;
  productName?: string;
  quantity: number;
  depotId?: string;
  trackSerial?: boolean;
  unitPrice?: number;
}

/**
 * Deducts stock from PostgreSQL database (DepotInventory & Product.totalStock),
 * marks SerialNumbers as ALLOCATED, and records StockTransaction.
 * Guarded to be strictly idempotent.
 */
export async function deductStockForInvoice(
  invoiceId: string,
  items: PurchaseItem[],
  defaultDepotId: string,
  invoiceNumber: string,
  customerName?: string
) {
  try {
    // 1. Idempotency Check: Prevent duplicate stock deductions for the same invoice
    const existingTransactions = await prisma.stockTransaction.findMany({
      where: {
        referenceNumber: invoiceNumber,
        type: 'SALE_DISPATCH',
      },
    });

    if (existingTransactions.length > 0) {
      console.log(`ℹ️ Stock for invoice ${invoiceNumber} already deducted (idempotent skip).`);
      return;
    }

    const allDepots = await prisma.depot.findMany();
    const depotMap = new Map(allDepots.map((d) => [d.id, d]));

    for (const item of items) {
      const itemDepotId = item.depotId || defaultDepotId;
      const qty = Math.max(0, Number(item.quantity) || 0);
      if (qty <= 0) continue;

      const depot = depotMap.get(itemDepotId) || allDepots[0];
      const finalDepotId = depot?.id || itemDepotId;

      // 1. Update DepotInventory record in database
      const depotInv = await prisma.depotInventory.findUnique({
        where: {
          productId_depotId: {
            productId: item.productId,
            depotId: finalDepotId,
          },
        },
      });

      if (depotInv) {
        const newDepotQty = Math.max(0, depotInv.quantity - qty);
        const newAvailQty = Math.max(0, depotInv.availableQuantity - qty);
        await prisma.depotInventory.update({
          where: { id: depotInv.id },
          data: {
            quantity: newDepotQty,
            availableQuantity: newAvailQty,
          },
        });
      }

      // 2. Recalculate and update Product Total Stock in database
      const allProductInvs = await prisma.depotInventory.findMany({
        where: { productId: item.productId },
      });
      const newTotalStock = allProductInvs.reduce((sum, inv) => sum + inv.quantity, 0);

      const product = await prisma.product.update({
        where: { id: item.productId },
        data: { totalStock: newTotalStock },
      });

      // 3. Serial Number Allocation
      if (item.trackSerial || product.trackSerial) {
        const availableSerials = await prisma.serialNumber.findMany({
          where: {
            productId: product.id,
            depotId: finalDepotId,
            status: 'IN_STOCK',
          },
          take: qty,
        });

        for (const serial of availableSerials) {
          let history: any[] = [];
          try {
            history = JSON.parse(serial.historyJson || '[]');
          } catch {
            history = [];
          }

          history.push({
            action: 'PURCHASE_ALLOCATED',
            invoiceId,
            invoiceNumber,
            customer: customerName || 'Wholesale Client',
            timestamp: new Date().toISOString(),
          });

          await prisma.serialNumber.update({
            where: { id: serial.id },
            data: {
              status: 'ALLOCATED',
              invoiceId,
              invoiceNumber,
              historyJson: JSON.stringify(history),
            },
          });
        }
      }

      // 4. Record Stock Transaction in Audit Ledger
      await prisma.stockTransaction.create({
        data: {
          type: 'SALE_DISPATCH',
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          sourceDepotId: finalDepotId,
          sourceDepotName: depot?.name || 'Depot Hub',
          quantity: qty,
          unitCost: product.purchasePrice || 0,
          referenceNumber: invoiceNumber,
          notes: `Customer purchase confirmed. Invoice: ${invoiceNumber}`,
          createdBy: 'Order Fulfilment System',
        },
      });

      // 5. Synchronize in-memory dataStore
      try {
        const memoryProd = dataStore.getProductById(product.id) || dataStore.getProductBySku(product.sku);
        if (memoryProd && memoryProd.depotBreakdown) {
          memoryProd.depotBreakdown[finalDepotId] = Math.max(
            0,
            (memoryProd.depotBreakdown[finalDepotId] || 0) - qty
          );
          memoryProd.totalStock = Object.values(memoryProd.depotBreakdown).reduce((a, b) => a + b, 0);
        }
      } catch (err) {
        console.error('Error syncing memory dataStore on stock deduction:', err);
      }
    }

    console.log(`✅ Successfully deducted stock in database for Invoice ${invoiceNumber}`);
  } catch (error) {
    console.error(`❌ Error deducting stock for invoice ${invoiceNumber}:`, error);
  }
}
