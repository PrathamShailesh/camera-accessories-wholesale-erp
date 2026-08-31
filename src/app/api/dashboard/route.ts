import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi, depotIdFilter } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'dashboard.view');
  if (!auth.ok) return auth.response;

  try {
    const depotFilter = depotIdFilter(auth.user);
    
    const [
      totalCustomers,
      totalProducts,
      totalDepots,
      activeProformas,
      pendingInvoices,
      shippedOrders,
      totalStockValue,
      recentInvoices,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.product.count(),
      depotFilter ? 1 : prisma.depot.count(),
      prisma.proforma.count({ where: depotFilter ? { items: { some: { selectedDepotId: depotFilter } }, status: { in: ['DRAFT', 'SENT', 'CONFIRMED'] } } : { status: { in: ['DRAFT', 'SENT', 'CONFIRMED'] } } }),
      prisma.taxInvoice.count({ where: depotFilter ? { depotId: depotFilter, fulfilmentStatus: { in: ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'] } } : { fulfilmentStatus: { in: ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'] } } }),
      prisma.shipment.count({ where: depotFilter ? { depotId: depotFilter, status: { in: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } : { status: { in: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.depotInventory.aggregate({ where: depotFilter ? { depotId: depotFilter } : undefined, _sum: { quantity: true } }),
      prisma.taxInvoice.findMany({ where: depotFilter ? { depotId: depotFilter } : undefined, take: 5, orderBy: { createdAt: 'desc' }, include: { customer: true } }),
    ]);

    const inventoryRows = await prisma.depotInventory.findMany({ where: depotFilter ? { depotId: depotFilter } : undefined, include: { product: true } });
    const stockValue = inventoryRows.reduce((sum, row) => sum + row.quantity * row.product.purchasePrice, 0);

    return NextResponse.json({
      totalCustomers,
      totalProducts,
      totalDepots,
      activeProformas,
      pendingInvoices,
      shippedOrders,
      totalStockUnits: totalStockValue._sum.quantity || 0,
      totalStockValue: stockValue,
      recentInvoices,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
