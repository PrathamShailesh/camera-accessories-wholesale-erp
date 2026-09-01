import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.read');
  if (!auth.ok) return auth.response;

  try {
    let invoice = await prisma.taxInvoice.findFirst({
      where: {
        OR: [
          { id: params.id },
          { invoiceNumber: params.id },
          { id: { equals: params.id, mode: 'insensitive' } },
          { invoiceNumber: { equals: params.id, mode: 'insensitive' } },
          { proformaId: params.id },
          { proformaNumber: { equals: params.id, mode: 'insensitive' } },
        ],
      },
      include: {
        customer: true,
        depot: true,
        items: {
          include: { product: true },
        },
        serialNumbers: true,
        packingDetails: true,
        shipment: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const depotDenied = assertDepotAccess(auth.user, invoice.depotId);
    if (depotDenied) return depotDenied;

    const mapped = {
      ...invoice,
      shippingDetails: invoice.shipment
        ? {
            courier: invoice.shipment.courier,
            airwayBillNumber: invoice.shipment.airwayBillNumber,
            trackingUrl: invoice.shipment.trackingUrl,
            shippingCost: invoice.shippingCost,
            weightKg: invoice.shipment.totalWeightKg,
            packageCount: invoice.shipment.packageCount,
            awbDocumentUrl: invoice.shipment.awbDocumentUrl,
          }
        : undefined,
    };

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req);
  if (!auth.ok) return auth.response;
  if (!hasPermission(auth.user.role, 'invoices.write') && !hasPermission(auth.user.role, 'invoices.fulfil')) {
    return NextResponse.json({ error: 'Forbidden: your role cannot update invoices' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      fulfilmentStatus,
      paymentStatus,
      notes,
      internalRemarks,
      packedBy,
      packageCount,
      totalWeightKg,
      lengthCm,
      widthCm,
      heightCm,
      packagePhotoUrl,
      courier,
      airwayBillNumber,
      trackingUrl,
      shippingCost,
      awbDocumentUrl,
    } = body;

    // Find existing invoice
    const existing = await prisma.taxInvoice.findFirst({
      where: {
        OR: [
          { id: params.id },
          { invoiceNumber: params.id },
          { id: { equals: params.id, mode: 'insensitive' } },
          { invoiceNumber: { equals: params.id, mode: 'insensitive' } },
        ],
      },
      include: {
        customer: true,
        depot: true,
        packingDetails: true,
        shipment: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const depotDenied = assertDepotAccess(auth.user, existing.depotId);
    if (depotDenied) return depotDenied;

    const updateData: any = {};
    if (fulfilmentStatus) updateData.fulfilmentStatus = fulfilmentStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (internalRemarks !== undefined) updateData.internalRemarks = internalRemarks;

    // Handle Packing Details upsert if packing fields provided
    if (packedBy || packageCount || totalWeightKg || packagePhotoUrl) {
      await prisma.packingDetails.upsert({
        where: { invoiceId: existing.id },
        create: {
          invoiceId: existing.id,
          packedBy: packedBy || 'Depot Staff',
          packageCount: Number(packageCount) || 1,
          totalWeightKg: Number(totalWeightKg) || 5.0,
          lengthCm: Number(lengthCm) || 40,
          widthCm: Number(widthCm) || 30,
          heightCm: Number(heightCm) || 20,
          packagePhotoUrl: packagePhotoUrl || null,
        },
        update: {
          packedBy: packedBy || 'Depot Staff',
          packageCount: Number(packageCount) || 1,
          totalWeightKg: Number(totalWeightKg) || 5.0,
          lengthCm: Number(lengthCm) || 40,
          widthCm: Number(widthCm) || 30,
          heightCm: Number(heightCm) || 20,
          ...(packagePhotoUrl ? { packagePhotoUrl } : {}),
        },
      });
    }

    // Handle Shipment upsert if shipping fields provided
    if (airwayBillNumber || courier) {
      const shipmentNumber = existing.shipment?.shipmentNumber || `SHP-2026-${String(Math.floor(10000 + Math.random() * 90000))}`;
      await prisma.shipment.upsert({
        where: { invoiceId: existing.id },
        create: {
          shipmentNumber,
          invoiceId: existing.id,
          invoiceNumber: existing.invoiceNumber,
          customerId: existing.customerId,
          customerName: existing.customerName,
          customerCompany: existing.customerCompany,
          destinationCountry: existing.billingAddress.includes('UAE') ? 'United Arab Emirates' : 'International',
          shippingAddress: existing.shippingAddress,
          depotId: existing.depotId,
          depotName: existing.depotName,
          courier: courier || 'DHL_EXPRESS',
          airwayBillNumber: airwayBillNumber || `DHL-${Date.now()}`,
          trackingUrl: trackingUrl || '',
          totalWeightKg: Number(totalWeightKg) || 5.0,
          packageCount: Number(packageCount) || 1,
          awbDocumentUrl: awbDocumentUrl || null,
        },
        update: {
          courier: courier || 'DHL_EXPRESS',
          airwayBillNumber: airwayBillNumber || `DHL-${Date.now()}`,
          trackingUrl: trackingUrl || '',
          totalWeightKg: Number(totalWeightKg) || 5.0,
          packageCount: Number(packageCount) || 1,
          ...(awbDocumentUrl ? { awbDocumentUrl } : {}),
        },
      });
    }

    if (fulfilmentStatus === 'SHIPPED' || fulfilmentStatus === 'DELIVERED') {
      const targetSerialStatus = fulfilmentStatus === 'DELIVERED' ? 'DELIVERED' : 'DISPATCHED';
      await prisma.serialNumber.updateMany({
        where: {
          invoiceId: existing.id,
          status: 'ALLOCATED',
        },
        data: {
          status: targetSerialStatus as any,
        },
      });
    }

    const invoice = await prisma.taxInvoice.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        customer: true,
        depot: true,
        items: {
          include: { product: true },
        },
        serialNumbers: true,
        packingDetails: true,
        shipment: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.write');
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.taxInvoice.findUnique({ where: { id: params.id }, select: { depotId: true } });
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const denied = assertDepotAccess(auth.user, existing.depotId);
    if (denied) return denied;
    await prisma.taxInvoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
