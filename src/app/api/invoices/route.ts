import { NextRequest, NextResponse } from 'next/server';
import { prisma, withDbTimeout } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { depotIdFilter, guardApi } from '@/lib/api-auth';
import { deductStockForInvoice } from '@/lib/inventory-service';
import { parsePagination } from '@/lib/pagination';
import { triggerInvoiceCreatedDepotEmail } from '@/lib/email-service';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'invoices.read');
  if (!auth.ok) return auth.response;

  try {
    const scopedDepotId = depotIdFilter(auth.user);
    const { take, skip } = parsePagination(req, { defaultLimit: 50, maxLimit: 200 });
    const q = req.nextUrl.searchParams.get('q')?.trim();
    const paymentStatus = req.nextUrl.searchParams.get('paymentStatus')?.trim();
    const fulfilmentStatus = req.nextUrl.searchParams.get('fulfilmentStatus')?.trim();

    const where: any = {};
    if (scopedDepotId) where.depotId = scopedDepotId;
    if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus;
    if (fulfilmentStatus && fulfilmentStatus !== 'ALL') where.fulfilmentStatus = fulfilmentStatus;
    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' as const } },
        { customerCompany: { contains: q, mode: 'insensitive' as const } },
        { customerName: { contains: q, mode: 'insensitive' as const } },
        { proformaNumber: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const invoices = await withDbTimeout(() =>
      prisma.taxInvoice.findMany({
        where: Object.keys(where).length > 0 ? where : undefined,
        include: {
          items: true,
          packingDetails: true,
          shipment: {
            select: {
              courier: true,
              airwayBillNumber: true,
              trackingUrl: true,
              totalWeightKg: true,
              packageCount: true,
              awbDocumentUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      })
    );

    const mappedInvoices = invoices.map((inv) => ({
      ...inv,
      shippingDetails: inv.shipment
        ? {
            courier: inv.shipment.courier,
            airwayBillNumber: inv.shipment.airwayBillNumber,
            trackingUrl: inv.shipment.trackingUrl,
            shippingCost: inv.shippingCost,
            weightKg: inv.shipment.totalWeightKg,
            packageCount: inv.shipment.packageCount,
            awbDocumentUrl: inv.shipment.awbDocumentUrl,
          }
        : undefined,
    }));

    return NextResponse.json(mappedInvoices, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    try {
      const q = req.nextUrl.searchParams.get('q')?.trim()?.toLowerCase();
      let list = dataStore.getInvoices();
      if (q) {
        list = list.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.customerCompany.toLowerCase().includes(q) ||
            inv.customerName.toLowerCase().includes(q) ||
            (inv.proformaNumber && inv.proformaNumber.toLowerCase().includes(q))
        );
      }
      return NextResponse.json(list);
    } catch {
      return NextResponse.json([]);
    }
  }
}

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'invoices.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { proformaId, depotId } = body;

    if (!proformaId) {
      return NextResponse.json({ error: 'ProformaId required for invoice creation' }, { status: 400 });
    }

    // Lookup proforma (DB or dataStore)
    let proforma: any = null;
    try {
      proforma = await prisma.proforma.findUnique({
        where: { id: proformaId },
        include: { items: true, customer: true },
      });
    } catch {}

    if (!proforma) {
      proforma = dataStore.getProformaById(proformaId);
    }

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    const finalDepotId = depotId || proforma.selectedDepotId || 'dep-central';
    const depot = dataStore.getDepotById(finalDepotId);
    const depotName = depot?.name || 'Central Depot';

    let invoice: any = null;
    try {
      const settings = await prisma.companySettings.findUnique({
        where: { id: 'global-settings' },
      });
      const nextNumber = settings?.invoiceNextNumber || 1;
      const invoiceNumber = `${settings?.invoicePrefix || 'INV-2026-'}${String(nextNumber).padStart(5, '0')}`;

      invoice = await prisma.taxInvoice.create({
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
          depotId: finalDepotId,
          depotName,
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
          currency: proforma.currency || 'USD',
          notes: proforma.notes,
        },
      });

      if (Array.isArray(proforma.items) && proforma.items.length > 0) {
        await prisma.invoiceItem.createMany({
          data: proforma.items.map((item: any) => ({
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
            depotName,
            trackSerial: item.trackSerial,
            isPicked: false,
          })),
        });
      }

      await prisma.proforma.update({
        where: { id: proformaId },
        data: {
          status: 'CONVERTED',
          convertedToInvoiceId: invoice.id,
          convertedToInvoiceNumber: invoice.invoiceNumber,
          convertedAt: new Date(),
        },
      });

      await prisma.companySettings.update({
        where: { id: 'global-settings' },
        data: { invoiceNextNumber: nextNumber + 1 },
      }).catch(() => {});

      if (proforma.customerId) {
        await prisma.customer.update({
          where: { id: proforma.customerId },
          data: {
            totalOrders: { increment: 1 },
            currentBalance: { increment: proforma.grandTotal || 0 },
          },
        }).catch(() => {});
      }
    } catch (dbErr) {
      // Fallback to dataStore
      invoice = dataStore.createInvoice({
        proformaId,
        proformaNumber: proforma.proformaNumber,
        customerId: proforma.customerId,
        customerName: proforma.customerName,
        customerCompany: proforma.customerCompany,
        customerEmail: proforma.customerEmail,
        customerPhone: proforma.customerPhone,
        billingAddress: proforma.billingAddress,
        shippingAddress: proforma.shippingAddress,
        depotId: finalDepotId,
        depotName,
        paymentTerms: proforma.paymentTerms,
        subtotal: proforma.subtotal,
        discountAmount: proforma.discountAmount,
        taxAmount: proforma.taxAmount,
        shippingCost: proforma.shippingCost,
        grandTotal: proforma.grandTotal,
        currency: proforma.currency || 'USD',
        notes: proforma.notes,
        items: proforma.items,
      });

      dataStore.updateProforma(proformaId, {
        status: 'CONVERTED',
        convertedToInvoiceId: invoice.id,
        convertedToInvoiceNumber: invoice.invoiceNumber,
      } as any);
    }

    try {
      triggerInvoiceCreatedDepotEmail(invoice);
    } catch {}

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create invoice' }, { status: 500 });
  }
}
