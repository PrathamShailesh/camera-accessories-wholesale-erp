import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';

async function invoiceForFulfilment(id: string) {
  return prisma.taxInvoice.findFirst({
    where: { OR: [{ id }, { invoiceNumber: id }] },
    select: { id: true, depotId: true },
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.fulfil');
  if (!auth.ok) return auth.response;

  try {
    const invoice = await invoiceForFulfilment(params.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const denied = assertDepotAccess(auth.user, invoice.depotId);
    if (denied) return denied;

    const body = await req.json();
    const { itemPicks } = body;
    const record = await prisma.taxInvoice.findUnique({ where: { id: invoice.id }, include: { items: true } });
    if (!record) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    for (const item of record.items) {
      const pick = itemPicks?.[item.id] ?? itemPicks?.find?.((p: any) => p.id === item.id)?.isPicked;
      if (pick !== undefined) await prisma.invoiceItem.update({ where: { id: item.id }, data: { isPicked: Boolean(pick) } });
    }
    const updatedInvoice = await prisma.taxInvoice.update({ where: { id: record.id }, data: { fulfilmentStatus: 'PROCESSING' }, include: { items: true } });
    return NextResponse.json({
      success: true,
      message: 'Items picked successfully',
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Picking failed' }, { status: 400 });
  }
}
