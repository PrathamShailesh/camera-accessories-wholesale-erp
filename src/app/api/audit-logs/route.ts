import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'audit.read');
  if (!auth.ok) return auth.response;

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
