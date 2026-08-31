import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductStockForInvoice } from '@/lib/inventory-service';
import { broadcastSystemEvent } from '@/lib/events-emitter';
import { guardApi } from '@/lib/api-auth';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await guardApi(req, 'invoices.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { depotId } = body;

    // Get the proforma by ID or proformaNumber
    let proforma = await prisma.proforma.findUnique({
      where: { id: params.id },
      include: { items: true, customer: true },
    });

    if (!proforma) {
      proforma = await prisma.proforma.findUnique({
        where: { proformaNumber: params.id },
        include: { items: true, customer: true },
      });
    }

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    if (proforma.status === 'CONVERTED' && proforma.convertedToInvoiceId) {
      return NextResponse.json({ error: `Proforma already converted to ${proforma.convertedToInvoiceNumber || 'a tax invoice'}`, invoiceId: proforma.convertedToInvoiceId }, { status: 409 });
    }
    if (proforma.status !== 'CONFIRMED') {
      return NextResponse.json({ error: 'Proforma must be confirmed before conversion' }, { status: 400 });
    }

    // Get depot name
    let selectedDepot = depotId ? await prisma.depot.findUnique({ where: { id: depotId } }) : null;
    if (!selectedDepot) {
      selectedDepot = await prisma.depot.findFirst();
    }
    const finalDepotId = selectedDepot?.id || depotId || 'dep-dxb';
    const finalDepotName = selectedDepot?.name || 'Dubai Central Distribution Hub';

    // Get invoice number
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'global-settings' },
    });
    const nextNumber = settings?.invoiceNextNumber || 1;
    const invoiceNumber = `${settings?.invoicePrefix || 'INV-2026-'}${String(nextNumber).padStart(5, '0')}`;

    // Create the invoice
    const existingInvoice = await prisma.taxInvoice.findFirst({ where: { proformaId: proforma.id }, select: { id: true, invoiceNumber: true } });
    if (existingInvoice) {
      return NextResponse.json({ error: `Proforma already converted to ${existingInvoice.invoiceNumber}`, invoiceId: existingInvoice.id }, { status: 409 });
    }
    const invoice = await prisma.taxInvoice.create({
      data: {
        invoiceNumber,
        customerId: proforma.customerId,
        customerName: proforma.customerName,
        customerEmail: proforma.customerEmail,
        customerCompany: proforma.customerCompany,
        customerPhone: proforma.customerPhone,
        billingAddress: proforma.billingAddress,
        shippingAddress: proforma.shippingAddress,
        depotId: finalDepotId,
        depotName: finalDepotName,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paymentTerms: proforma.paymentTerms,
        paymentStatus: 'UNPAID',
        fulfilmentStatus: 'READY_FOR_PACKING',
        notes: proforma.notes,
        subtotal: proforma.subtotal,
        discountAmount: proforma.discountAmount,
        taxAmount: proforma.taxAmount,
        shippingCost: proforma.shippingCost,
        grandTotal: proforma.grandTotal,
        proformaId: proforma.id,
        proformaNumber: proforma.proformaNumber,
      },
    });

    // Create invoice items
    for (const item of proforma.items) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          brand: item.brand,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalPrice: item.totalPrice,
          depotId: item.selectedDepotId || finalDepotId,
          depotName: item.selectedDepotName || finalDepotName,
          trackSerial: item.trackSerial,
        },
      });
    }

    // Deduct stock in database & allocate serials
    await deductStockForInvoice(
      invoice.id,
      proforma.items.map((i) => ({
        productId: i.productId,
        productSku: i.productSku,
        productName: i.productName,
        quantity: i.quantity,
        depotId: i.selectedDepotId || finalDepotId,
        trackSerial: i.trackSerial,
        unitPrice: i.unitPrice,
      })),
      finalDepotId,
      invoice.invoiceNumber,
      proforma.customerCompany || proforma.customerName
    );

    // Update proforma status
    await prisma.proforma.update({
      where: { id: proforma.id },
      data: {
        status: 'CONVERTED',
        convertedToInvoiceId: invoice.id,
        convertedToInvoiceNumber: invoice.invoiceNumber,
        convertedAt: new Date(),
      },
    });

    // Update invoice number counter
    await prisma.companySettings.update({
      where: { id: 'global-settings' },
      data: { invoiceNextNumber: nextNumber + 1 },
    });

    // Fetch complete invoice with relations
    const completeInvoice = await prisma.taxInvoice.findUnique({
      where: { id: invoice.id },
      include: { items: true, customer: true, depot: true },
    });

    try {
      broadcastSystemEvent({
        type: 'PROFORMA_UPDATED',
        id: proforma.id,
        proformaNumber: proforma.proformaNumber,
        status: 'CONVERTED',
        data: completeInvoice || invoice,
      });
    } catch {}

    return NextResponse.json(completeInvoice || invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error converting proforma:', error);
    return NextResponse.json({ error: error.message || 'Conversion failed' }, { status: 500 });
  }
}
