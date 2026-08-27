import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const invoices = await prisma.taxInvoice.findMany({
      include: {
        customer: true,
        depot: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { proformaId, depotId } = body;

    // If converting from proforma
    if (proformaId) {
      const proforma = await prisma.proforma.findUnique({
        where: { id: proformaId },
        include: { items: true, customer: true },
      });

      if (!proforma) {
        return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
      }

      if (proforma.status !== 'CONFIRMED') {
        return NextResponse.json({ error: 'Proforma must be confirmed before conversion' }, { status: 400 });
      }

      const depot = await prisma.depot.findUnique({
        where: { id: depotId },
      });

      if (!depot) {
        return NextResponse.json({ error: 'Depot not found' }, { status: 404 });
      }

      // Get current invoice number
      const settings = await prisma.companySettings.findUnique({
        where: { id: 'global-settings' },
      });
      const nextNumber = settings?.invoiceNextNumber || 1;
      const invoiceNumber = `${settings?.invoicePrefix || 'INV-2026-'}${String(nextNumber).padStart(5, '0')}`;

      // Create invoice
      const invoice = await prisma.taxInvoice.create({
        data: {
          invoiceNumber,
          proformaId,
          proformaNumber: proforma.proformaNumber,
          customerId: proforma.customerId,
          customerName: proforma.customerName,
          customerEmail: proforma.customerEmail,
          customerCompany: proforma.customerCompany,
          customerPhone: proforma.customerPhone,
          billingAddress: proforma.billingAddress,
          shippingAddress: proforma.shippingAddress,
          depotId,
          depotName: depot.name,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          paymentTerms: proforma.paymentTerms,
          paymentStatus: 'UNPAID',
          fulfilmentStatus: 'READY_FOR_PACKING',
          subtotal: proforma.subtotal,
          discountAmount: proforma.discountAmount,
          taxAmount: proforma.taxAmount,
          shippingCost: proforma.shippingCost,
          grandTotal: proforma.grandTotal,
          currency: proforma.currency,
          notes: proforma.notes,
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
            depotId,
            depotName: depot.name,
            trackSerial: item.trackSerial,
            isPicked: false,
          },
        });

        // Allocate serial numbers if tracking is enabled
        if (item.trackSerial) {
          const serials = await prisma.serialNumber.findMany({
            where: {
              productId: item.productId,
              depotId,
              status: 'IN_STOCK',
            },
            take: item.quantity,
          });

          for (const serial of serials) {
            await prisma.serialNumber.update({
              where: { id: serial.id },
              data: {
                status: 'ALLOCATED',
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
              },
            });
          }
        }
      }

      // Update proforma status
      await prisma.proforma.update({
        where: { id: proformaId },
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

      // Fetch complete invoice
      const completeInvoice = await prisma.taxInvoice.findUnique({
        where: { id: invoice.id },
        include: { items: true, customer: true, depot: true },
      });

      return NextResponse.json(completeInvoice, { status: 201 });
    }

    return NextResponse.json({ error: 'ProformaId required for invoice creation' }, { status: 400 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
