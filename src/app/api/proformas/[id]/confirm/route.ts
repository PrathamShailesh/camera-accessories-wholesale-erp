import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = dataStore.updateProformaStatus(params.id, 'CONFIRMED');
    if (!updated) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, proforma: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
