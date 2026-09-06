import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { guardApi, depotIdFilter } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'dashboard.view');
  if (!auth.ok) return auth.response;

  const depotFilter = depotIdFilter(auth.user);

  try {
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
      prisma.taxInvoice.findMany({
        where: depotFilter ? { depotId: depotFilter } : undefined,
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          invoiceNumber: true,
          grandTotal: true,
          paymentStatus: true,
          fulfilmentStatus: true,
          currency: true,
          createdAt: true,
          customerName: true,
          customerCompany: true,
        },
      }),
    ]);

    const inventoryRows = await prisma.depotInventory.findMany({
      where: depotFilter ? { depotId: depotFilter } : undefined,
      select: {
        quantity: true,
        product: { select: { purchasePrice: true } },
      },
    });
    const stockValue = inventoryRows.reduce((sum, row) => sum + row.quantity * (row.product?.purchasePrice || 0), 0);

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
    try {
      const customers = dataStore.getCustomers();
      const products = dataStore.getProducts();
      const depots = dataStore.getDepots();
      const proformas = dataStore.getProformas();
      const invoices = dataStore.getInvoices();
      const shipments = dataStore.getShipments();

      const totalStockUnits = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
      const totalStockValue = products.reduce((sum, p) => sum + (p.totalStock || 0) * (p.purchasePrice || 0), 0);

      return NextResponse.json({
        totalCustomers: customers.length,
        totalProducts: products.length,
        totalDepots: depotFilter ? 1 : depots.length,
        activeProformas: proformas.filter((p) => p.status === 'DRAFT' || p.status === 'SENT' || p.status === 'CONFIRMED').length,
        pendingInvoices: invoices.filter((i) => ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'].includes(i.fulfilmentStatus)).length,
        shippedOrders: shipments.filter((s) => ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length,
        totalStockUnits,
        totalStockValue,
        recentInvoices: invoices.slice(0, 5),
      });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
  }
}
