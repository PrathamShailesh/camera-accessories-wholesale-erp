import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
import { guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guardApi(req, 'customers.read');
  if (!auth.ok) return auth.response;

  try {
    let customer: any = null;
    try {
      customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          proformas: { orderBy: { createdAt: 'desc' }, take: 50 },
          taxInvoices: { orderBy: { createdAt: 'desc' }, take: 50 },
          shipments: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      });
    } catch (dbErr) {
      // Prisma offline, proceed to dataStore fallback
    }

    if (!customer) {
      const fallback = dataStore.getCustomerById(id);
      if (fallback) {
        const customerProformas = dataStore.getProformas({ customerId: fallback.id });
        const customerInvoices = dataStore.getInvoices({ customerId: fallback.id });
        customer = {
          ...fallback,
          proformas: customerProformas,
          taxInvoices: customerInvoices,
          shipments: [],
        };
      }
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guardApi(req, 'customers.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const {
      companyName,
      contactPerson,
      email,
      phone,
      billingAddress,
      shippingAddress,
      country,
      taxNumber,
      paymentTerms,
      creditLimit,
      status,
      notes,
    } = body;

    const updateData: any = {};
    if (companyName) updateData.companyName = companyName.trim();
    if (contactPerson) updateData.contactPerson = contactPerson.trim();
    if (email) updateData.email = email.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (billingAddress !== undefined) updateData.billingAddress = billingAddress.trim();
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress.trim();
    if (country !== undefined) updateData.country = country.trim();
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber.trim();
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (creditLimit !== undefined) updateData.creditLimit = Number(creditLimit);
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    let customer: any = null;
    try {
      customer = await prisma.customer.update({
        where: { id },
        data: updateData,
      });
    } catch (dbErr) {
      // Fallback to dataStore
      customer = dataStore.updateCustomer(id, updateData);
    }

    if (!customer) {
      // Try by ID in dataStore if not already attempted
      customer = dataStore.updateCustomer(id, updateData);
    }

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await guardApi(req, 'customers.write');
  if (!auth.ok) return auth.response;

  try {
    try {
      await prisma.customer.delete({
        where: { id },
      });
    } catch (dbErr) {
      // Prisma offline, proceed to dataStore delete
    }

    dataStore.deleteCustomer(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
