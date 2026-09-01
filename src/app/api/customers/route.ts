import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';
import { parsePagination } from '@/lib/pagination';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'customers.read');
  if (!auth.ok) return auth.response;

  try {
    const { take, skip } = parsePagination(req);
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'customers.write');
  if (!auth.ok) return auth.response;

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
