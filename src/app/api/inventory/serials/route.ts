import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi, depotIdFilter } from '@/lib/api-auth';
import { parsePagination } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'serials.read');
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;
    let depotId = searchParams.get('depotId') || undefined;
    const status = searchParams.get('status') || undefined;
    const { take, skip } = parsePagination(req);

    // For depot users, enforce their assigned depot
    const depotFilter = depotIdFilter(auth.user);
    if (depotFilter) {
      depotId = depotFilter;
    }

    // productSku/productName/depotName/invoiceNumber are denormalized onto
    // SerialNumber itself — no relation include needed for display.
    const serials = await prisma.serialNumber.findMany({
      where: { ...(productId && { productId }), ...(depotId && { depotId }), ...(status && { status: status as any }) },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return NextResponse.json({ success: true, serials });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
