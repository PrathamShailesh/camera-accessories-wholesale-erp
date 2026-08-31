import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.fulfil');
  if (!auth.ok) return auth.response;

  try {
    const invoice = await prisma.taxInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      select: { depotId: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const denied = assertDepotAccess(auth.user, invoice.depotId);
    if (denied) return denied;

    const body = await req.json();
    const {
      courier,
      customCourierName,
      airwayBillNumber,
      trackingUrl,
      shippingCost,
      weightKg,
      packageCount,
      dimensionsCm,
      airwayBillDocUrl,
      packagePhotoUrl,
    } = body;

    if (!airwayBillNumber) {
      return NextResponse.json({ error: 'Airway Bill number is required' }, { status: 400 });
    }

    const existing = await prisma.taxInvoice.findFirst({ where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] }, include: { customer: true } });
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const shipmentNumber = `SHP-${Date.now()}`;
    const shipment = await prisma.shipment.create({ data: { shipmentNumber, invoiceId: existing.id, invoiceNumber: existing.invoiceNumber, customerId: existing.customerId, customerName: existing.customerName, customerCompany: existing.customerCompany, destinationCountry: existing.customer.country, shippingAddress: existing.shippingAddress, depotId: existing.depotId, depotName: existing.depotName, courier: courier || 'DHL_EXPRESS', customCourierName, airwayBillNumber, trackingUrl: trackingUrl || `https://track.courier.com/?awb=${airwayBillNumber}`, totalWeightKg: Number(weightKg) || 1, packageCount: Number(packageCount) || 1, awbDocumentUrl: airwayBillDocUrl || null, status: 'DISPATCHED' } });
    await prisma.taxInvoice.update({ where: { id: existing.id }, data: { fulfilmentStatus: 'SHIPPED', shipmentId: shipment.id } });
    await prisma.serialNumber.updateMany({ where: { invoiceId: existing.id, status: 'ALLOCATED' }, data: { status: 'DISPATCHED' } });

    return NextResponse.json({
      success: true,
      message: `Order dispatched with Airway Bill ${airwayBillNumber}`,
      shipment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Dispatch failed' }, { status: 400 });
  }
}
