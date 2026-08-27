import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;
    const depotId = searchParams.get('depotId') || undefined;
    const status = searchParams.get('status') || undefined;

    const serials = dataStore.getSerialNumbers({ productId, depotId, status: status as any });
    return NextResponse.json({ success: true, serials });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
