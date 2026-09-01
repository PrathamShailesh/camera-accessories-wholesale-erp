import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi, sanitizeProductForRole } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'products.read');
  if (!auth.ok) return auth.response;

  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        inventories: {
          include: { depot: true },
        },
        serialNumbers: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeProductForRole(product, auth.user.role));
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'products.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();

    // Destructure out non-scalar / relational fields before passing to Prisma
    const {
      inventories,      // handled below
      depotBreakdown,   // not a Prisma column
      id: _id,          // never let caller overwrite PK
      sku: _sku,        // SKU is immutable once created
      createdAt: _ca,
      updatedAt: _ua,
      category,         // relation object – not a scalar
      serialNumbers: _sn,
      serialCount: _sc,
      totalStock: _ts,  // recalculated below
      ...scalarData
    } = body;

    // Build typed inventories from depotBreakdown if inventories array not provided
    const inventoryUpdates: { depotId: string; quantity: number }[] =
      inventories ??
      (depotBreakdown
        ? Object.entries(depotBreakdown).map(([depotId, qty]) => ({
            depotId,
            quantity: Math.max(0, parseInt(qty as any) || 0),
          }))
        : null);

    const result = await prisma.$transaction(async (tx) => {
      // Update scalar product fields
      await tx.product.update({
        where: { id: params.id },
        data: scalarData,
      });

      // Upsert each depot inventory row
      if (inventoryUpdates) {
        for (const inv of inventoryUpdates) {
          const qty = Math.max(0, inv.quantity);
          await tx.depotInventory.upsert({
            where: { productId_depotId: { productId: params.id, depotId: inv.depotId } },
            update: { quantity: qty, availableQuantity: qty },
            create: {
              productId: params.id,
              depotId: inv.depotId,
              quantity: qty,
              allocatedQuantity: 0,
              availableQuantity: qty,
              minStockLevel: Number(scalarData.minStockLevel) || 5,
            },
          });
        }
      }

      // Recalculate totalStock from all depot rows
      const allInv = await tx.depotInventory.findMany({ where: { productId: params.id } });
      const newTotalStock = allInv.reduce((sum, inv) => sum + inv.quantity, 0);

      return tx.product.update({
        where: { id: params.id },
        data: { totalStock: newTotalStock },
        include: {
          category: true,
          inventories: { include: { depot: true } },
          serialNumbers: true,
        },
      });
    });

    return NextResponse.json(sanitizeProductForRole(result, auth.user.role));
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'products.write');
  if (!auth.ok) return auth.response;

  try {
    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
