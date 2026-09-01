import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'customers.read');
  if (!auth.ok) return auth.response;

  try {
    // Cap order-history relations to the most recent 50 each — a long-time
    // customer's full history is unbounded otherwise, and the detail page
    // only needs a recent-activity view, not every order ever placed.
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        proformas: { orderBy: { createdAt: 'desc' }, take: 50 },
        taxInvoices: { orderBy: { createdAt: 'desc' }, take: 50 },
        shipments: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: error.message || 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'customers.write');
  if (!auth.ok) return auth.response;

  try {
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
