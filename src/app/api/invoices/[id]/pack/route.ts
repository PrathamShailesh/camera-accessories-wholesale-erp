import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.fulfil');
  if (!auth.ok) return auth.response;

  try {
    const invoice = await prisma.taxInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: { customer: true, depot: true, items: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const denied = assertDepotAccess(auth.user, invoice.depotId);
    if (denied) return denied;

    const body = await req.json();
    const { packedBy, packageCount, totalWeightKg, dimensionsCm, packagePhotoUrl, notes } = body;

    const packedInvoice = await prisma.taxInvoice.update({
      where: { id: invoice.id },
      data: {
        fulfilmentStatus: 'PACKED',
        packingDetails: {
          upsert: {
            create: {
              packedBy: packedBy || auth.user.name || 'Depot Staff',
              packageCount: Math.max(1, Number(packageCount) || 1),
              totalWeightKg: Math.max(0.1, Number(totalWeightKg) || 1.0),
              lengthCm: Number(dimensionsCm?.length) || 30,
              widthCm: Number(dimensionsCm?.width) || 25,
              heightCm: Number(dimensionsCm?.height) || 20,
              packagePhotoUrl: packagePhotoUrl || null,
              packingNotes: notes || null,
            },
            update: {
              packedBy: packedBy || auth.user.name || 'Depot Staff',
              packageCount: Math.max(1, Number(packageCount) || 1),
              totalWeightKg: Math.max(0.1, Number(totalWeightKg) || 1.0),
              lengthCm: Number(dimensionsCm?.length) || 30,
              widthCm: Number(dimensionsCm?.width) || 25,
              heightCm: Number(dimensionsCm?.height) || 20,
              ...(packagePhotoUrl ? { packagePhotoUrl } : {}),
              packingNotes: notes || null,
            },
          },
        },
      },
      include: { items: true, packingDetails: true, customer: true, depot: true },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id || 'usr-depot',
          userName: auth.user.name || 'Depot User',
          userRole: (auth.user.role as any) || 'DEPOT_USER',
          action: 'PACK_ORDER',
          entityType: 'INVOICE',
          entityId: invoice.id,
          entityLabel: invoice.invoiceNumber,
          description: `Order packed (${packedInvoice.packingDetails?.packageCount} pkgs, ${packedInvoice.packingDetails?.totalWeightKg}kg) for #${invoice.invoiceNumber}`,
        },
      });
    } catch (auditErr) {
      console.warn('Failed to record audit log on pack:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Order packed successfully and marked READY FOR DISPATCH',
      invoice: packedInvoice,
    });
  } catch (error: any) {
    console.error('Error in packing API:', error);
    return NextResponse.json({ error: error.message || 'Packing failed' }, { status: 400 });
  }
}
