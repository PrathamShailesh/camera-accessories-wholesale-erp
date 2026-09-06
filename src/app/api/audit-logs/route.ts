import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import dataStore from '@/lib/data-store';
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
    try {
      return NextResponse.json(dataStore.getAuditLogs());
    } catch {
      return NextResponse.json([]);
    }
  }
}
