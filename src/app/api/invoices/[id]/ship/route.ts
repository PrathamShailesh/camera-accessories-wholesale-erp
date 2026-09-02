import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';
import { triggerShipmentDispatchedManagerEmail } from '@/lib/email-service';
import { deductStockForInvoice } from '@/lib/inventory-service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.fulfil');
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.taxInvoice.findFirst({
      where: { OR: [{ id: params.id }, { invoiceNumber: params.id }] },
      include: { customer: true, items: true, packingDetails: true, depot: true, shipment: true },
    });
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const denied = assertDepotAccess(auth.user, existing.depotId);
    if (denied) return denied;

    // Idempotency / Duplicate protection: Check if already shipped
    if (existing.shipmentId || existing.fulfilmentStatus === 'SHIPPED' || existing.fulfilmentStatus === 'DELIVERED') {
      return NextResponse.json(
        {
          error: `This invoice has already been dispatched with shipment ${existing.shipment?.shipmentNumber || existing.shipmentId}`,
          shipment: existing.shipment,
        },
        { status: 409 }
      );
    }

    const body = await req.json();
    const {
      courier,
      customCourierName,
      airwayBillNumber,
      trackingUrl,
      weightKg,
      packageCount,
      airwayBillDocUrl,
    } = body;

    if (!airwayBillNumber || !airwayBillNumber.trim()) {
      return NextResponse.json({ error: 'Airway Bill (AWB) / Tracking number is required' }, { status: 400 });
    }

    const finalCourier = courier || 'DHL_EXPRESS';
    const finalWeight = Number(weightKg) || existing.packingDetails?.totalWeightKg || 5.0;
    const finalPackages = Number(packageCount) || existing.packingDetails?.packageCount || 1;
    const finalTrackingUrl =
      trackingUrl ||
      (finalCourier === 'DHL_EXPRESS'
        ? `https://www.dhl.com/en/express/tracking.html?AWB=${airwayBillNumber.replace(/[^0-9]/g, '')}`
        : `https://track.courier.com/?awb=${encodeURIComponent(airwayBillNumber.trim())}`);

    const shipmentNumber = `SHP-${Date.now()}`;
    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        invoiceId: existing.id,
        invoiceNumber: existing.invoiceNumber,
        customerId: existing.customerId,
        customerName: existing.customerName,
        customerCompany: existing.customerCompany,
        destinationCountry: existing.customer?.country || 'International',
        shippingAddress: existing.shippingAddress,
        depotId: existing.depotId,
        depotName: existing.depotName,
        courier: finalCourier,
        customCourierName: customCourierName || null,
        airwayBillNumber: airwayBillNumber.trim(),
        trackingUrl: finalTrackingUrl,
        totalWeightKg: finalWeight,
        packageCount: finalPackages,
        awbDocumentUrl: airwayBillDocUrl || null,
        status: 'DISPATCHED',
      },
    });

    const updatedInvoice = await prisma.taxInvoice.update({
      where: { id: existing.id },
      data: { fulfilmentStatus: 'SHIPPED', shipmentId: shipment.id },
      include: { items: true, packingDetails: true, customer: true, depot: true, shipment: true },
    });

    // Update serial numbers to DISPATCHED
    await prisma.serialNumber.updateMany({
      where: { invoiceId: existing.id, status: 'ALLOCATED' },
      data: { status: 'DISPATCHED' },
    });

    // Ensure inventory is deducted exactly once (idempotent guard inside deductStockForInvoice)
    try {
      await deductStockForInvoice(
        existing.id,
        existing.items.map((i) => ({
          productId: i.productId,
          productSku: i.productSku,
          productName: i.productName,
          quantity: i.quantity,
          depotId: i.depotId || existing.depotId,
          trackSerial: i.trackSerial,
        })),
        existing.depotId,
        existing.invoiceNumber,
        existing.customerCompany || existing.customerName
      );
    } catch (stockErr) {
      console.warn('Stock deduction already processed or noted:', stockErr);
    }

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: auth.user.id || 'usr-depot',
          userName: auth.user.name || 'Depot User',
          userRole: (auth.user.role as any) || 'DEPOT_USER',
          action: 'DISPATCH_ORDER',
          entityType: 'SHIPMENT',
          entityId: shipment.id,
          entityLabel: shipment.airwayBillNumber,
          description: `Dispatched order #${existing.invoiceNumber} via ${finalCourier} with AWB #${shipment.airwayBillNumber}`,
        },
      });
    } catch (auditErr) {
      console.warn('Failed to record audit log on dispatch:', auditErr);
    }

    // Trigger async transactional email for Super Admin (non-blocking)
    try {
      triggerShipmentDispatchedManagerEmail(shipment, updatedInvoice);
    } catch (emailErr) {
      console.error('Failed to queue manager email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Order dispatched with Airway Bill ${airwayBillNumber}`,
      shipment,
      invoice: updatedInvoice,
    });
  } catch (error: any) {
    console.error('Error in dispatch API:', error);
    return NextResponse.json({ error: error.message || 'Dispatch failed' }, { status: 400 });
  }
}
