import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.read');
  if (!auth.ok) return auth.response;

  try {
    const invoice = await (prisma as any).serviceInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: { items: true, customer: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Service invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error fetching service invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch service invoice' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.write');
  if (!auth.ok) return auth.response;

  try {
    const existing = await (prisma as any).serviceInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Service invoice not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status, notes, internalRemarks, paymentTerms } = body;

    const updated = await (prisma as any).serviceInvoice.update({
      where: { id: existing.id },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(internalRemarks !== undefined ? { internalRemarks } : {}),
        ...(paymentTerms ? { paymentTerms } : {}),
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Service invoice updated',
      invoice: updated,
    });
  } catch (error: any) {
    console.error('Error updating service invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to update service invoice' }, { status: 500 });
  }
}
