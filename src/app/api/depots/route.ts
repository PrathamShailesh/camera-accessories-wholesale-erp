import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const depots = await prisma.depot.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(depots);
  } catch (error) {
    console.error('Error fetching depots:', error);
    return NextResponse.json({ error: 'Failed to fetch depots' }, { status: 500 });
  }
}
