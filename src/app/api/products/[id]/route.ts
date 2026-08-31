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
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(sanitizeProductForRole(product, auth.user.role));
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
