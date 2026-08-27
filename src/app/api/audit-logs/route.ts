import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
