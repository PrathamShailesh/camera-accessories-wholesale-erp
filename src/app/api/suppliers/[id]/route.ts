import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'customers.read');
  if (!auth.ok) return auth.response;

  try {
    let supplier: any = null;
    try {
      supplier = await prisma.supplier.findUnique({
        where: { id: params.id },
      });
    } catch (dbErr) {
      // DB fallback
    }

    if (!supplier) {
      supplier = dataStore.getSupplierById(params.id);
    }

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'customers.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { name, contactPerson, email, phone, address, country, taxId, paymentTerms } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson.trim();
    if (email !== undefined) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (country !== undefined) updateData.country = country.trim();
    if (taxId !== undefined) updateData.taxId = taxId.trim();
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms.trim();

    let supplier: any = null;
    try {
      supplier = await prisma.supplier.update({
        where: { id: params.id },
        data: updateData,
      });
    } catch (dbErr) {
      // Fallback
    }

    const dsSupplier = dataStore.updateSupplier(params.id, updateData);
    if (!supplier) supplier = dsSupplier;

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error('Error updating supplier:', error);
    return NextResponse.json({ error: error.message || 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'customers.write');
  if (!auth.ok) return auth.response;

  try {
    try {
      await prisma.supplier.delete({
        where: { id: params.id },
      });
    } catch (dbErr) {
      // Prisma fallback
    }

    dataStore.deleteSupplier(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
