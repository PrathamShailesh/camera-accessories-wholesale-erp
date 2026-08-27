import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { itemPicks } = body; // array of { itemId, serials?: string[] }
    const updatedInvoice = dataStore.pickInvoiceItems(params.id, itemPicks);
    return NextResponse.json({
      success: true,
      message: 'Items picked successfully',
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Picking failed' }, { status: 400 });
  }
}
