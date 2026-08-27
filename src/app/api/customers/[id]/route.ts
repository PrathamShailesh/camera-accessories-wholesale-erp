import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        proformas: true,
        taxInvoices: true,
        shipments: true,
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
  try {
    const body = await req.json();
    
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
