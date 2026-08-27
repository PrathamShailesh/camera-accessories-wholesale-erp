import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, depotId, deltaQty, reason, notes } = body;

    if (!productId || !depotId || deltaQty === undefined || !reason) {
      return NextResponse.json({ error: 'productId, depotId, deltaQty, and reason are required' }, { status: 400 });
    }

    const adjustment = dataStore.adjustStock(productId, depotId, Number(deltaQty), reason, notes);
    return NextResponse.json({ success: true, adjustment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
