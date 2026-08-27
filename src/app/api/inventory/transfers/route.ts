import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sourceDepotId, destinationDepotId, items, notes } = body;

    if (sourceDepotId === destinationDepotId) {
      return NextResponse.json({ error: 'Source and destination depots must be different' }, { status: 400 });
    }

    const sourceDepot = await prisma.depot.findUnique({
      where: { id: sourceDepotId },
    });
    const destDepot = await prisma.depot.findUnique({
      where: { id: destinationDepotId },
    });

    if (!sourceDepot || !destDepot) {
      return NextResponse.json({ error: 'Depot not found' }, { status: 404 });
    }

    // Generate transfer number
    const lastTransfer = await prisma.stockTransfer.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const lastNumber = lastTransfer ? parseInt(lastTransfer.transferNumber.split('-')[2]) : 0;
    const transferNumber = `TR-2026-${String(lastNumber + 1).padStart(5, '0')}`;

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceDepotId,
        sourceDepotName: sourceDepot.name,
        destinationDepotId,
        destinationDepotName: destDepot.name,
        status: 'PENDING',
        notes,
        createdBy: 'System',
      },
    });

    // Create transfer items
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) throw new Error(`Product ${item.productId} not found`);

      await prisma.stockTransferItem.create({
        data: {
          transferId: transfer.id,
          productId: item.productId,
          productSku: product.sku,
          productName: product.name,
          quantity: item.quantity,
          serialNumbers: item.serialNumbers || [],
        },
      });

      // Update depot inventory
      await prisma.depotInventory.updateMany({
        where: {
          productId: item.productId,
          depotId: sourceDepotId,
        },
        data: {
          quantity: { decrement: item.quantity },
          availableQuantity: { decrement: item.quantity },
        },
      });

      await prisma.depotInventory.upsert({
        where: {
          productId_depotId: {
            productId: item.productId,
            depotId: destinationDepotId,
          },
        },
        update: {
          quantity: { increment: item.quantity },
          availableQuantity: { increment: item.quantity },
        },
        create: {
          productId: item.productId,
          depotId: destinationDepotId,
          quantity: item.quantity,
          allocatedQuantity: 0,
          availableQuantity: item.quantity,
          minStockLevel: 10,
        },
      });
    }

    // Update product total stock
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (product) {
        const totalStock = await prisma.depotInventory
          .findMany({ where: { productId: item.productId } })
          .then((invs) => invs.reduce((sum, inv) => sum + inv.quantity, 0));
        
        await prisma.product.update({
          where: { id: item.productId },
          data: { totalStock },
        });
      }
    }

    const completeTransfer = await prisma.stockTransfer.findUnique({
      where: { id: transfer.id },
      include: { items: true },
    });

    return NextResponse.json(completeTransfer, { status: 201 });
  } catch (error) {
    console.error('Error creating transfer:', error);
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
