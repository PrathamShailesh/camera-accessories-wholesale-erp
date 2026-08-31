import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.fulfil');
  if (!auth.ok) return auth.response;

  try {
    const invoice = await prisma.taxInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      select: { depotId: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const denied = assertDepotAccess(auth.user, invoice.depotId);
    if (denied) return denied;

    const body = await req.json();
    const { packedBy, packageCount, totalWeightKg, dimensionsCm, packagePhotoUrl, notes } = body;

    const record = await prisma.taxInvoice.findFirst({ where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] } });
    if (!record) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const packedInvoice = await prisma.taxInvoice.update({
      where: { id: record.id },
      data: {
        fulfilmentStatus: 'PACKED',
        packingDetails: {
          upsert: {
            create: { packedBy: packedBy || auth.user.name, packageCount: Number(packageCount) || 1, totalWeightKg: Number(totalWeightKg) || 1, lengthCm: Number(dimensionsCm?.length) || 30, widthCm: Number(dimensionsCm?.width) || 25, heightCm: Number(dimensionsCm?.height) || 20, packagePhotoUrl: packagePhotoUrl || null, packingNotes: notes || null },
            update: { packedBy: packedBy || auth.user.name, packageCount: Number(packageCount) || 1, totalWeightKg: Number(totalWeightKg) || 1, lengthCm: Number(dimensionsCm?.length) || 30, widthCm: Number(dimensionsCm?.width) || 25, heightCm: Number(dimensionsCm?.height) || 20, ...(packagePhotoUrl ? { packagePhotoUrl } : {}), packingNotes: notes || null },
          },
        },
      },
      include: { items: true, packingDetails: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Order packed successfully and marked READY FOR DISPATCH',
      invoice: packedInvoice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Packing failed' }, { status: 400 });
  }
}
