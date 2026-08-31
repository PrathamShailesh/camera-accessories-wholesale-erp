import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi, depotIdFilter } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'serials.read');
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;
    let depotId = searchParams.get('depotId') || undefined;
    const status = searchParams.get('status') || undefined;

    // For depot users, enforce their assigned depot
    const depotFilter = depotIdFilter(auth.user);
    if (depotFilter) {
      depotId = depotFilter;
    }

    const serials = await prisma.serialNumber.findMany({ where: { ...(productId && { productId }), ...(depotId && { depotId }), ...(status && { status: status as any }) }, include: { product: true, depot: true, invoice: true }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, serials });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
