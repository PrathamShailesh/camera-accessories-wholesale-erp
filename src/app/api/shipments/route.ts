import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const shipments = await prisma.shipment.findMany({
      include: {
        invoice: true,
        customer: true,
        depot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(shipments);
  } catch (error) {
    console.error('Error fetching shipments:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoiceId, courier, airwayBillNumber, trackingUrl, totalWeightKg, packageCount, awbDocumentUrl } = body;

    const invoice = await prisma.taxInvoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true, depot: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate shipment number
    const lastShipment = await prisma.shipment.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const lastNumber = lastShipment ? parseInt(lastShipment.shipmentNumber.split('-')[2]) : 0;
    const shipmentNumber = `SHP-2026-${String(lastNumber + 1).padStart(5, '0')}`;

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        customerCompany: invoice.customerCompany,
        destinationCountry: invoice.customer.shippingAddress.split(',').pop()?.trim() || 'Unknown',
        shippingAddress: invoice.shippingAddress,
        depotId: invoice.depotId,
        depotName: invoice.depotName,
        courier: courier || 'DHL_EXPRESS',
        airwayBillNumber,
        trackingUrl: trackingUrl || '',
        status: 'DISPATCHED',
        totalWeightKg: totalWeightKg || 5.0,
        packageCount: packageCount || 1,
        dispatchedAt: new Date(),
        awbDocumentUrl,
      },
    });

    // Update invoice with shipment reference
    await prisma.taxInvoice.update({
      where: { id: invoiceId },
      data: {
        shipmentId: shipment.id,
        fulfilmentStatus: 'SHIPPED',
      },
    });

    // Update serial numbers status
    await prisma.serialNumber.updateMany({
      where: { invoiceId },
      data: { status: 'DISPATCHED' },
    });

    const completeShipment = await prisma.shipment.findUnique({
      where: { id: shipment.id },
      include: { invoice: true, customer: true, depot: true },
    });

    return NextResponse.json(completeShipment, { status: 201 });
  } catch (error) {
    console.error('Error creating shipment:', error);
    return NextResponse.json({ error: 'Failed to create shipment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (status === 'DELIVERED') {
      const shipment = await prisma.shipment.update({
        where: { id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      // Update invoice status
      await prisma.taxInvoice.update({
        where: { id: shipment.invoiceId },
        data: { fulfilmentStatus: 'DELIVERED' },
      });

      // Update serial numbers status
      await prisma.serialNumber.updateMany({
        where: { invoiceId: shipment.invoiceId },
        data: { status: 'RETURNED' },
      });

      return NextResponse.json(shipment);
    }

    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
  } catch (error) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
  }
}
