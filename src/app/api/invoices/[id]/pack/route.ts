import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { packedBy, packageCount, totalWeightKg, dimensionsCm, packagePhotoUrl, notes } = body;

    const packedInvoice = dataStore.packInvoice(params.id, {
      packedBy: packedBy || dataStore.getCurrentUser().name,
      packageCount: Number(packageCount) || 1,
      totalWeightKg: Number(totalWeightKg) || 1,
      dimensionsCm: dimensionsCm || { length: 30, width: 25, height: 20 },
      packagePhotoUrl,
      notes,
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
