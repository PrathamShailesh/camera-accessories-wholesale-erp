import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';
import { parsePagination } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'proformas.read');
  if (!auth.ok) return auth.response;

  try {
    const { take, skip } = parsePagination(req);
    // customerCompany/customerName are denormalized onto Proforma itself —
    // the list view doesn't touch the customer relation or line items, so
    // no include/select is needed beyond the model's own scalar columns.
    const proformas = await prisma.proforma.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return NextResponse.json(proformas);
  } catch (error) {
    console.error('Error fetching proformas:', error);
    return NextResponse.json({ error: 'Failed to fetch proformas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { items, customerId, discountPercent, shippingCost, notes, deliveryTerms, paymentTerms, expiryDays } = body;

    // Get customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get current proforma number
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'global-settings' },
    });
    const nextNumber = settings?.proformaNextNumber || 1;
    const proformaNumber = `${settings?.proformaPrefix || 'PF-2026-'}${String(nextNumber).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;

    const proformaItems = await Promise.all(items.map(async (item: any) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) throw new Error(`Product ${item.productId} not found`);

      const itemDisc = item.discountPercent || 0;
      const itemSub = item.quantity * item.unitPrice * (1 - itemDisc / 100);
      const itemTax = itemSub * (product.taxRate / 100);
      const itemTotal = itemSub + itemTax;

      subtotal += item.quantity * item.unitPrice;
      totalTax += itemTax;

      const depot = item.selectedDepotId ? await prisma.depot.findUnique({
        where: { id: item.selectedDepotId },
      }) : undefined;

      return {
        productId: product.id,
        productSku: product.sku,
        productName: product.name,
        brand: product.brand,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: itemDisc,
        taxRate: product.taxRate,
        taxAmount: Number(itemTax.toFixed(2)),
        totalPrice: Number(itemTotal.toFixed(2)),
        selectedDepotId: depot?.id,
        selectedDepotName: depot?.name,
        trackSerial: product.trackSerial,
      };
    }));

    const discountAmount = (subtotal * (discountPercent || 0)) / 100;
    const grandTotal = subtotal - discountAmount + totalTax + (shippingCost || 0);

    const proforma = await prisma.proforma.create({
      data: {
        proformaNumber,
        customerId,
        customerName: customer.contactPerson,
        customerEmail: customer.email,
        customerCompany: customer.companyName,
        customerPhone: customer.phone,
        billingAddress: customer.billingAddress,
        shippingAddress: customer.shippingAddress,
        issueDate: new Date(),
        expiryDate: new Date(Date.now() + (expiryDays || 15) * 24 * 60 * 60 * 1000),
        paymentTerms: paymentTerms || 'NET 30 days from dispatch',
        deliveryTerms: deliveryTerms || 'Air Freight via Courier (CIF)',
        notes,
        subtotal,
        discountPercent: discountPercent || 0,
        discountAmount,
        taxAmount: totalTax,
        shippingCost: shippingCost || 0,
        grandTotal,
        status: 'DRAFT',
      },
    });

    // Create proforma items
    for (const item of proformaItems) {
      await prisma.proformaItem.create({
        data: {
          ...item,
          proformaId: proforma.id,
        },
      });
    }

    // Update proforma number counter
    await prisma.companySettings.update({
      where: { id: 'global-settings' },
      data: { proformaNextNumber: nextNumber + 1 },
    });

    // Fetch complete proforma with items
    const completeProforma = await prisma.proforma.findUnique({
      where: { id: proforma.id },
      include: { items: true, customer: true },
    });

    return NextResponse.json(completeProforma, { status: 201 });
  } catch (error) {
    console.error('Error creating proforma:', error);
    return NextResponse.json({ error: 'Failed to create proforma' }, { status: 500 });
  }
}
