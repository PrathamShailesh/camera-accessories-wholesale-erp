import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { assignedDepotId } = body;

    // params.id is the proformaId
    const newInvoice = dataStore.convertProformaToTaxInvoice(params.id, assignedDepotId);

    return NextResponse.json({
      success: true,
      message: `Proforma converted successfully into Tax Invoice ${newInvoice.invoiceNumber}`,
      invoice: newInvoice,
    });
  } catch (error: any) {
    console.error('Conversion Error:', error);
    return NextResponse.json({ error: error.message || 'Conversion failed' }, { status: 400 });
  }
}
