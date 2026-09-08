import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { assertDepotAccess, guardApi } from '@/lib/api-auth';
import { hasPermission } from '@/lib/rbac';
import { restoreStockForCancelledInvoice } from '@/lib/inventory-service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guardApi(req, 'invoices.read');
  if (!auth.ok) return auth.response;

  try {
    let invoice: any = null;
    try {
      invoice = await prisma.taxInvoice.findFirst({
        where: {
          OR: [
            { id },
            { invoiceNumber: id },
            { id: { equals: id, mode: 'insensitive' } },
            { invoiceNumber: { equals: id, mode: 'insensitive' } },
            { proformaId: id },
            { proformaNumber: { equals: id, mode: 'insensitive' } },
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
    } catch (dbErr) {}

    if (!invoice) {
      invoice = dataStore.getInvoiceById(id);
    }

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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    } = body;

    let existing: any = null;
    try {
      existing = await prisma.taxInvoice.findFirst({
        where: {
          OR: [
            { id },
            { invoiceNumber: id },
            { id: { equals: id, mode: 'insensitive' } },
            { invoiceNumber: { equals: id, mode: 'insensitive' } },
          ],
        },
        include: { items: true },
      });
    } catch {}

    if (!existing) {
      existing = dataStore.getInvoiceById(id);
    }

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const depotDenied = assertDepotAccess(auth.user, existing.depotId);
    if (depotDenied) return depotDenied;

    // Cancellation Business Rules
    if (fulfilmentStatus === 'CANCELLED') {
      if (existing.fulfilmentStatus === 'DELIVERED') {
        return NextResponse.json(
          { error: 'Cannot cancel an invoice that has already been delivered to the customer.' },
          { status: 400 }
        );
      }
      if (existing.fulfilmentStatus === 'SHIPPED') {
        return NextResponse.json(
          { error: 'Cannot cancel an invoice currently in-transit with courier. Process a return instead.' },
          { status: 400 }
        );
      }

      // Restore stock & release allocated serials safely via operational workflow
      const itemsToRestore = (existing.items || []).map((it: any) => ({
        productId: it.productId,
        productSku: it.productSku,
        productName: it.productName,
        quantity: it.quantity,
        depotId: existing.depotId,
      }));
      await restoreStockForCancelledInvoice(
        existing.id,
        existing.invoiceNumber,
        itemsToRestore,
        existing.depotId
      );
    }

    const updateData: any = {};
    if (fulfilmentStatus !== undefined) updateData.fulfilmentStatus = fulfilmentStatus;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (notes !== undefined) updateData.notes = notes;
    if (internalRemarks !== undefined) updateData.internalRemarks = internalRemarks;

    let invoice: any = null;
    try {
      invoice = await prisma.taxInvoice.update({
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

      // When payment status transitions to PAID, update Customer totalSpent and balance in both DB and dataStore
      if (paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID' && existing.customerId) {
        const grandTotal = existing.grandTotal || 0;
        try {
          await prisma.customer.update({
            where: { id: existing.customerId },
            data: {
              totalSpent: { increment: grandTotal },
              currentBalance: { decrement: grandTotal },
            },
          });
        } catch {}

        try {
          const cust = dataStore.getCustomerById(existing.customerId);
          if (cust) {
            dataStore.updateCustomer(existing.customerId, {
              totalSpent: (cust.totalSpent || 0) + grandTotal,
              currentBalance: Math.max(0, (cust.currentBalance || 0) - grandTotal),
            });
          }
        } catch {}
      }
    } catch (dbErr) {
      invoice = dataStore.updateInvoice(existing.id, updateData);
      if (paymentStatus === 'PAID' && existing.paymentStatus !== 'PAID' && existing.customerId) {
        const cust = dataStore.getCustomerById(existing.customerId);
        if (cust) {
          dataStore.updateCustomer(existing.customerId, {
            totalSpent: (cust.totalSpent || 0) + (existing.grandTotal || 0),
            currentBalance: Math.max(0, (cust.currentBalance || 0) - (existing.grandTotal || 0)),
          });
        }
      }
    }

    if (!invoice) {
      invoice = dataStore.updateInvoice(existing.id, updateData);
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guardApi(req, 'invoices.write');
  if (!auth.ok) return auth.response;

  try {
    let existing: any = null;
    try {
      existing = await prisma.taxInvoice.findFirst({
        where: { OR: [{ id }, { invoiceNumber: id }] },
        select: { id: true, depotId: true, fulfilmentStatus: true },
      });
    } catch {}

    if (!existing) {
      existing = dataStore.getInvoiceById(id);
    }

    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const denied = assertDepotAccess(auth.user, existing.depotId);
    if (denied) return denied;

    if (existing.fulfilmentStatus !== 'DRAFT' && existing.fulfilmentStatus !== 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot delete an active invoice in status "${existing.fulfilmentStatus}". Cancel it first.` },
        { status: 400 }
      );
    }

    try {
      await prisma.taxInvoice.delete({
        where: { id: existing.id },
      });
    } catch (dbErr) {}

    dataStore.deleteInvoice(existing.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

