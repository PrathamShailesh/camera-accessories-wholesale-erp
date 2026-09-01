import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';
import { guardApi } from '@/lib/api-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    const updated = dataStore.updateProforma(params.id, { status: 'CONFIRMED' });
    if (!updated) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, proforma: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
