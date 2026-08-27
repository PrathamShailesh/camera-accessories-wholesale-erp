import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Generate customer code
    const lastCustomer = await prisma.customer.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    const lastNumber = lastCustomer ? parseInt(lastCustomer.customerCode.split('-')[2]) : 0;
    const customerCode = `CUST-${body.country.substring(0, 3).toUpperCase()}-${String(lastNumber + 1).padStart(3, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        ...body,
        customerCode,
        currentBalance: 0,
        status: 'ACTIVE',
        totalOrders: 0,
        totalSpent: 0,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
