import { NextRequest, NextResponse } from 'next/server';
import { prisma, withDbTimeout } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { guardApi, depotIdFilter } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'depots.read');
  if (!auth.ok) return auth.response;

  try {
    const scopedDepotId = depotIdFilter(auth.user);
    const whereClause = scopedDepotId ? { id: scopedDepotId } : undefined;

    const depots = await withDbTimeout(() =>
      prisma.depot.findMany({
        where: whereClause,
        include: {
          inventories: {
            include: {
              product: true,
            },
          },
          taxInvoices: {
            where: {
              fulfilmentStatus: {
                in: ['READY_FOR_PACKING', 'PROCESSING', 'PACKED'],
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    );

    const enrichedDepots = depots.map((d) => {
      const totalUnits = d.inventories.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
      const totalValue = d.inventories.reduce((sum, inv) => {
        const price = inv.product?.wholesalePrice || inv.product?.sellingPrice || inv.product?.purchasePrice || 0;
        return sum + (inv.quantity || 0) * price;
      }, 0);
      const activeOrders = d.taxInvoices.length;

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        city: d.city,
        country: d.country,
        address: d.address,
        contactPerson: d.contactPerson,
        email: d.email,
        phone: d.phone,
        isCentralHub: d.isCentralHub,
        totalStockUnits: totalUnits,
        totalStockValue: totalValue,
        activeOrdersCount: activeOrders,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      };
    });

    return NextResponse.json(enrichedDepots);
  } catch (error) {
    console.error('Error fetching depots from DB, using fallback:', error);
    try {
      return NextResponse.json(dataStore.getDepots());
    } catch {
      return NextResponse.json([]);
    }
  }
}
