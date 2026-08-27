import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        inventories: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total stock from inventories
    const productsWithStock = products.map(product => ({
      ...product,
      totalStock: product.inventories.reduce((sum, inv) => sum + inv.quantity, 0),
    }));

    return NextResponse.json(productsWithStock);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Calculate total stock from depot breakdown
    const totalStock = Object.values(body.depotBreakdown || {}).reduce((sum: number, qty) => sum + (qty as number), 0);

    const product = await prisma.product.create({
      data: {
        ...body,
        totalStock,
      },
    });

    // Create depot inventory records
    if (body.depotBreakdown) {
      for (const [depotId, quantity] of Object.entries(body.depotBreakdown)) {
        if (quantity > 0) {
          await prisma.depotInventory.create({
            data: {
              productId: product.id,
              depotId,
              quantity: quantity as number,
              allocatedQuantity: 0,
              availableQuantity: quantity as number,
              minStockLevel: body.minStockLevel || 10,
            },
          });
        }
      }
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
