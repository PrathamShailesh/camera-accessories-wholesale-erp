import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        depot: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, ...userData } = body;

    let passwordHash = '';
    if (password) {
      const { hashPassword } = await import('@/lib/auth');
      passwordHash = hashPassword(password);
    }

    const user = await prisma.user.create({
      data: {
        ...userData,
        passwordHash: passwordHash || undefined,
      },
      include: { depot: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}
