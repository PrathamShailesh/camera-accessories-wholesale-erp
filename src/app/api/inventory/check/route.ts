import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, depotId, quantity } = body;

    if (!productId || !depotId || quantity === undefined) {
      return NextResponse.json({ error: 'productId, depotId, and quantity are required' }, { status: 400 });
    }

    const check = dataStore.checkStockAvailability(productId, depotId, Number(quantity));
    return NextResponse.json({ success: true, check });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
