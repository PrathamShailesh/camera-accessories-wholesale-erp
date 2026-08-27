import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
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
      prisma.depot.count(),
      prisma.proforma.count({ where: { status: { in: ['DRAFT', 'SENT', 'CONFIRMED'] } } }),
      prisma.taxInvoice.count({ where: { fulfilmentStatus: { in: ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'] } } }),
      prisma.shipment.count({ where: { status: { in: ['DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'] } } }),
      prisma.depotInventory.aggregate({
        _sum: { quantity: true },
      }),
      prisma.taxInvoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: true },
      }),
    ]);

    const stockValue = await prisma.product.aggregate({
      _sum: { purchasePrice: true },
    });

    return NextResponse.json({
      totalCustomers,
      totalProducts,
      totalDepots,
      activeProformas,
      pendingInvoices,
      shippedOrders,
      totalStockUnits: totalStockValue._sum.quantity || 0,
      totalStockValue: stockValue._sum.purchasePrice || 0,
      recentInvoices,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
