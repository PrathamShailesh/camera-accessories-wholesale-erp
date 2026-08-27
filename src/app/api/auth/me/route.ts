import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthToken } from '@/lib/auth';
import dataStore from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('erp_auth_token')?.value;

    let user: any = null;

    if (token) {
      const decoded = verifyAuthToken(token);
      if (decoded && decoded.userId) {
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { depot: true },
        });
      }
    }

    if (!user) {
      // Fallback to dataStore current user
      const current = dataStore.getCurrentUser();
      if (current) {
        user = await prisma.user.findUnique({
          where: { id: current.id },
          include: { depot: true },
        });
        if (!user) user = current;
      }
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedDepotId: user.assignedDepotId,
        assignedDepotName: user.assignedDepotName,
        avatar: user.avatar,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
