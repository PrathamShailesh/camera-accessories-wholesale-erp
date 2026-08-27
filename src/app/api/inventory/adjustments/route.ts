import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function GET() {
  try {
    const adjustments = dataStore.getAdjustments();
    return NextResponse.json(adjustments);
  } catch (error: any) {
    console.error('Error fetching stock adjustments:', error);
    return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, depotId, deltaQty, reason, notes } = body;

    if (!productId || !depotId || deltaQty === undefined || !reason) {
      return NextResponse.json(
        { error: 'productId, depotId, deltaQty, and reason are required' },
        { status: 400 }
      );
    }

    const adjustment = dataStore.adjustStock(
      productId,
      depotId,
      Number(deltaQty),
      reason,
      notes
    );

    return NextResponse.json({ success: true, adjustment }, { status: 201 });
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to adjust stock' }, { status: 400 });
  }
}
