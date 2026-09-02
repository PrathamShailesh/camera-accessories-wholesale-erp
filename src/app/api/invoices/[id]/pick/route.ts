import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.fulfil');
  if (!auth.ok) return auth.response;

  try {
    // 1. Validate Order exists with items
    const invoice = await prisma.taxInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: {
        items: { include: { product: true } },
        customer: true,
        depot: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Validate Depot access
    const denied = assertDepotAccess(auth.user, invoice.depotId);
    if (denied) return denied;

    // 3. Validate Order status
    if (invoice.fulfilmentStatus === 'SHIPPED' || invoice.fulfilmentStatus === 'DELIVERED') {
      return NextResponse.json(
        { error: 'Order has already been dispatched/delivered.' },
        { status: 409 }
      );
    }

    if (invoice.fulfilmentStatus === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Order has been cancelled and cannot be picked.' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { itemPicks } = body;

    // 4. Bulk fetch inventory for all items in a single query
    const productIds = (invoice.items || []).map((i) => i.productId);
    const depotInvs = await prisma.depotInventory.findMany({
      where: {
        depotId: invoice.depotId,
        productId: { in: productIds },
      },
    });

    const stockMap = new Map(depotInvs.map((inv) => [inv.productId, inv.quantity]));

    // Check stock shortages
    const shortages: Array<{ productId: string; productName: string; requested: number; available: number }> = [];
    for (const item of invoice.items || []) {
      const available = stockMap.get(item.productId) || 0;
      if (available < item.quantity) {
        shortages.push({
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available,
        });
      }
    }

    // 5. Execute atomic Prisma transaction for picking operation
    const updatedInvoice = await prisma.$transaction(async (tx) => {
      // Update item picked flags
      for (const item of invoice.items || []) {
        let isPicked = true;
        if (itemPicks) {
          const pick = itemPicks[item.id] ?? itemPicks.find?.((p: any) => p.id === item.id)?.isPicked;
          if (pick !== undefined) {
            isPicked = Boolean(pick);
          }
        }

        await tx.invoiceItem.update({
          where: { id: item.id },
          data: { isPicked },
        });
      }

      // Update invoice status to PROCESSING
      const updated = await tx.taxInvoice.update({
        where: { id: invoice.id },
        data: { fulfilmentStatus: 'PROCESSING' },
        include: { items: true, customer: true, depot: true, packingDetails: true },
      });

      // Create Audit Log entry
      await tx.auditLog.create({
        data: {
          userId: auth.user.id || 'usr-depot',
          userName: auth.user.name || 'Depot User',
          userRole: (auth.user.role as any) || 'DEPOT_USER',
          action: 'PICK_ITEMS',
          entityType: 'INVOICE',
          entityId: invoice.id,
          entityLabel: invoice.invoiceNumber,
          description: `Items picked for invoice #${invoice.invoiceNumber} at depot ${invoice.depotName}`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Picking confirmed successfully',
      invoice: updatedInvoice,
      shortages: shortages.length > 0 ? shortages : undefined,
    });
  } catch (error: any) {
    console.error('❌ Server error in picking API:', error);

    // Filter out internal NodeJS abort/reset messages into friendly user text
    const rawMsg = String(error?.message || '');
    const isAborted = rawMsg.includes('aborted') || rawMsg.includes('ECONNRESET');
    const userMessage = isAborted
      ? 'The picking request was interrupted. Please try clicking Confirm Picking again.'
      : rawMsg || 'Failed to complete picking operation.';

    return NextResponse.json({ error: userMessage }, { status: isAborted ? 409 : 500 });
  }
}
