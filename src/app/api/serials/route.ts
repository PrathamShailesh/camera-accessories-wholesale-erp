import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi, depotIdFilter } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'serials.read');
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    let depotId = searchParams.get('depotId');
    const status = searchParams.get('status');

    // For depot users, enforce their assigned depot
    const depotFilter = depotIdFilter(auth.user);
    if (depotFilter) {
      depotId = depotFilter;
    }

    const serials = await prisma.serialNumber.findMany({
      where: {
        ...(productId && { productId }),
        ...(depotId && { depotId }),
        ...(status && { status: status as any }),
      },
      include: {
        product: true,
        depot: true,
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(serials);
  } catch (error) {
    console.error('Error fetching serial numbers:', error);
    return NextResponse.json({ error: 'Failed to fetch serial numbers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'serials.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    
    const serial = await prisma.serialNumber.create({
      data: body,
    });

    return NextResponse.json(serial, { status: 201 });
  } catch (error) {
    console.error('Error creating serial number:', error);
    return NextResponse.json({ error: 'Failed to create serial number' }, { status: 500 });
  }
}
