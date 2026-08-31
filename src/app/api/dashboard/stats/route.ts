import { NextRequest, NextResponse } from 'next/server';
import { guardApi, depotIdFilter } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'dashboard.view');
  if (!auth.ok) return auth.response;

  try {
    const depotId = depotIdFilter(auth.user);
    const invoiceWhere = depotId ? { depotId, fulfilmentStatus: { not: 'CANCELLED' as const } } : { fulfilmentStatus: { not: 'CANCELLED' as const } };
    const [invoices, products, inventory] = await Promise.all([
      prisma.taxInvoice.findMany({ where: invoiceWhere, include: { items: true } }),
      prisma.product.findMany(),
      prisma.depotInventory.findMany({ where: depotId ? { depotId } : undefined }),
    ]);
    const revenue = invoices.reduce((s, i) => s + i.grandTotal, 0);
    const units = inventory.reduce((s, i) => s + i.quantity, 0);
    const cost = invoices.reduce((s, i) => s + i.items.reduce((x, item) => {
      const p = products.find((p) => p.id === item.productId);
      return x + item.quantity * (p?.purchasePrice || 0);
    }, 0), 0);
    const stats = { totalRevenue: revenue, grossProfit: revenue - cost, totalStockUnits: units, totalProducts: products.length };
    const insights: any[] = [];
    const profitability = products.map((p) => {
      const sold = invoices.flatMap((i) => i.items).filter((item) => item.productId === p.id);
      const unitsSold = sold.reduce((sum, item) => sum + item.quantity, 0);
      const totalRevenue = sold.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const totalCost = unitsSold * p.purchasePrice;
      const grossProfit = totalRevenue - totalCost;
      return { productId: p.id, productName: p.name, sku: p.sku, brand: p.brand, categoryName: p.categoryName || 'General', unitsSold, totalRevenue, totalCost, grossProfit, grossMarginPercent: totalRevenue ? Number(((grossProfit / totalRevenue) * 100).toFixed(1)) : 0, averageSellingPrice: unitsSold ? totalRevenue / unitsSold : p.sellingPrice, averagePurchasePrice: p.purchasePrice };
    });

    return NextResponse.json({
      success: true,
      stats,
      insights,
      profitability,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
