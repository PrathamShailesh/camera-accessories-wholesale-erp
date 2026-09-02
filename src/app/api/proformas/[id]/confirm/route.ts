import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';
import { broadcastSystemEvent } from '@/lib/events-emitter';
import { canTransition, ProformaStatus } from '@/lib/proforma-workflow';

/**
 * Confirms a proforma (customer accepted the quotation).
 *
 * Previously this wrote to the in-memory data store, so confirmations were lost
 * on restart and never reached the database.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    const existing = await prisma.proforma.findFirst({
      where: { OR: [{ id: params.id }, { proformaNumber: params.id }] },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    const check = canTransition(existing.status as ProformaStatus, 'CONFIRMED');
    if (!check.ok) {
      return NextResponse.json({ error: check.reason }, { status: 400 });
    }

    const proforma = await prisma.proforma.update({
      where: { id: existing.id },
      data: { status: 'CONFIRMED' },
      include: { customer: true, items: true },
    });

    try {
      broadcastSystemEvent({
        type: 'PROFORMA_CONFIRMED',
        id: proforma.id,
        proformaNumber: proforma.proformaNumber,
        status: proforma.status,
        data: proforma,
      });
    } catch (evtErr) {
      console.warn('Could not broadcast confirmation event:', evtErr);
    }

    return NextResponse.json({ success: true, proforma });
  } catch (error: any) {
    console.error('Error confirming proforma:', error);
    return NextResponse.json({ error: error.message || 'Failed to confirm proforma' }, { status: 500 });
  }
}
