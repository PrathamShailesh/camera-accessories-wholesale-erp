import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'shipments.read');
  if (!auth.ok) return auth.response;

  try {
    let shipment: any = null;
    try {
      shipment = await prisma.shipment.findFirst({
        where: {
          OR: [
            { id: params.id },
            { shipmentNumber: params.id },
            { invoiceId: params.id },
          ],
        },
        include: {
          invoice: true,
        },
      });
    } catch {}

    if (!shipment) {
      shipment = dataStore.getShipmentById(params.id);
    }

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json(shipment);
  } catch (error) {
    console.error('Error fetching shipment detail:', error);
    return NextResponse.json({ error: 'Failed to fetch shipment' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'shipments.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { status, courier, trackingUrl, airwayBillNumber, notes } = body;

    let updated: any = null;
    try {
      let existingShipment: any = await prisma.shipment.findFirst({
        where: {
          OR: [{ id: params.id }, { shipmentNumber: params.id }, { invoiceId: params.id }],
        },
      });

      if (existingShipment) {
        updated = await prisma.shipment.update({
          where: { id: existingShipment.id },
          data: {
            ...(status && { status }),
            ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
            ...(courier && { courier }),
            ...(trackingUrl && { trackingUrl }),
            ...(airwayBillNumber && { airwayBillNumber }),
          },
        });

        if (status === 'DELIVERED' && existingShipment.invoiceId) {
          try {
            await prisma.taxInvoice.update({
              where: { id: existingShipment.invoiceId },
              data: { fulfilmentStatus: 'DELIVERED' },
            });
          } catch {}
        }
      }
    } catch {}

    const storeUpdated = dataStore.updateShipment(params.id, {
      ...body,
      ...(status === 'DELIVERED' && {
        status: 'DELIVERED',
        actualDeliveryDate: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
      }),
    });

    if (status === 'DELIVERED') {
      dataStore.deliverShipment(params.id);
    }

    if (!updated) {
      updated = storeUpdated;
    }

    if (!updated) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shipment: updated });
  } catch (error: any) {
    console.error('Error updating shipment:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update shipment' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  return PATCH(req, context);
}
