import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi, depotIdFilter } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await guardApi(req, 'depots.read');
  if (!auth.ok) return auth.response;

  try {
    const depotFilter = depotIdFilter(auth.user);
    let depots;

    if (depotFilter) {
      // Depot users can only see their assigned depot
      depots = await prisma.depot.findMany({
        where: { id: depotFilter },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Super admins, managers, ERP users can see all depots
      depots = await prisma.depot.findMany({
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    return NextResponse.json({ error: 'Failed to fetch depots' }, { status: 500 });
  }
}
