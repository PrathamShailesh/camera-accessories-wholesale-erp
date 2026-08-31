import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'inventory.adjust');
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const { productId, depotId, deltaQty, reason, notes } = body;

    if (!productId || !depotId || deltaQty === undefined || !reason) {
      return NextResponse.json({ error: 'productId, depotId, deltaQty, and reason are required' }, { status: 400 });
    }
    const denied = assertDepotAccess(auth.user, depotId);
    if (denied) return denied;

    const inventory = await prisma.depotInventory.findUnique({ where: { productId_depotId: { productId, depotId } }, include: { product: true, depot: true } });
    if (!inventory) return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    const delta = Number(deltaQty);
    if (!Number.isFinite(delta) || inventory.quantity + delta < 0 || inventory.availableQuantity + delta < 0) return NextResponse.json({ error: 'Adjustment would make stock negative' }, { status: 400 });
    const adjustment = await prisma.$transaction(async (tx) => {
      const updated = await tx.depotInventory.update({ where: { id: inventory.id }, data: { quantity: { increment: delta }, availableQuantity: { increment: delta } } });
      await tx.product.update({ where: { id: productId }, data: { totalStock: { increment: delta } } });
      return tx.stockAdjustment.create({ data: { productId, productSku: inventory.product.sku, productName: inventory.product.name, depotId, depotName: inventory.depot.name, deltaQty: delta, previousQty: inventory.quantity, newQty: updated.quantity, reason, user: auth.user.name, notes } });
    });
    return NextResponse.json({ success: true, adjustment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
