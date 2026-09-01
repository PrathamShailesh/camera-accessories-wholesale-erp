import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';

/**
 * PUT /api/products/bulk-update-stock
 *
 * Body: { products: [{ sku, blrStock, dxbStock, bomStock, sinStock }] }
 *
 * For each row: looks up the product by SKU, upserts DepotInventory
 * records, and recalculates totalStock. Skips rows where the SKU is
 * not found and reports them in the response.
 */
export async function PUT(req: NextRequest) {
  const auth = await guardApi(req, 'products.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { products } = body;

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload: products must be a non-empty array' },
        { status: 400 }
      );
    }

    const allDepots = await prisma.depot.findMany();
    const depotMap = new Map(allDepots.map((d) => [d.id, d]));

    const updatedRows: { sku: string; totalStock: number }[] = [];
    const skippedRows: { sku: string; reason: string }[] = [];

    for (const row of products) {
      const rawSku = row.sku?.toString().trim().toUpperCase();
      if (!rawSku) {
        skippedRows.push({ sku: '(empty)', reason: 'SKU is missing' });
        continue;
      }

      const product = await prisma.product.findUnique({ where: { sku: rawSku } });
      if (!product) {
        skippedRows.push({ sku: rawSku, reason: `SKU "${rawSku}" not found in database` });
        continue;
      }

      // Build depot breakdown from the row's stock columns
      const depotBreakdown: Record<string, number> = {};
      allDepots.forEach((depot) => {
        const codeKey = depot.code.toLowerCase().replace('dep-', '');
        const qty =
          row.depotBreakdown?.[depot.id] ??
          row[`${codeKey}Stock`] ??
          row[depot.id] ??
          row[depot.code] ??
          row[depot.name] ??
          null;

        if (qty !== null && qty !== undefined) {
          depotBreakdown[depot.id] = Math.max(0, parseInt(qty) || 0);
        }
      });

      if (Object.keys(depotBreakdown).length === 0) {
        skippedRows.push({ sku: rawSku, reason: 'No depot stock columns found in row' });
        continue;
      }

      try {
        // Upsert each depot inventory and recalculate total
        let newTotal = 0;
        for (const [depotId, qty] of Object.entries(depotBreakdown)) {
          const depot = depotMap.get(depotId);
          if (!depot) continue;

          await prisma.depotInventory.upsert({
            where: { productId_depotId: { productId: product.id, depotId } },
            update: { quantity: qty, availableQuantity: qty },
            create: {
              productId: product.id,
              depotId,
              quantity: qty,
              allocatedQuantity: 0,
              availableQuantity: qty,
              minStockLevel: product.minStockLevel || 5,
            },
          });
          newTotal += qty;
        }

        // Recalculate total from ALL depot rows (not just the ones in this batch)
        const allInv = await prisma.depotInventory.findMany({ where: { productId: product.id } });
        const totalStock = allInv.reduce((sum, inv) => sum + inv.quantity, 0);

        await prisma.product.update({
          where: { id: product.id },
          data: { totalStock },
        });

        updatedRows.push({ sku: rawSku, totalStock });
      } catch (err: any) {
        skippedRows.push({ sku: rawSku, reason: err.message || 'Database error' });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedRows.length,
      skippedCount: skippedRows.length,
      updated: updatedRows,
      skipped: skippedRows,
    });
  } catch (error: any) {
    console.error('Bulk stock update error:', error);
    return NextResponse.json({ error: error.message || 'Bulk stock update failed' }, { status: 500 });
  }
}
