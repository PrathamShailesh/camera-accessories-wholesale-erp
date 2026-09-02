import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastSystemEvent } from '@/lib/events-emitter';
import { guardApi } from '@/lib/api-auth';
import { canTransition, isProformaStatus, ProformaStatus } from '@/lib/proforma-workflow';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'proformas.read');
  if (!auth.ok) return auth.response;

  try {
    let proforma = await prisma.proforma.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!proforma) {
      proforma = await prisma.proforma.findUnique({
        where: { proformaNumber: params.id },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
      });
    }

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    return NextResponse.json(proforma);
  } catch (error) {
    console.error('Error fetching proforma:', error);
    return NextResponse.json({ error: 'Failed to fetch proforma' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const { status, notes } = body;

    // Find id if params.id was proformaNumber
    const existing = await prisma.proforma.findFirst({
      where: {
        OR: [{ id: params.id }, { proformaNumber: params.id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    const targetId = existing.id;

    // Validate the status change server-side — the client is not trusted to
    // enforce the lifecycle (and CONVERTED must only ever come from /convert).
    if (status !== undefined) {
      if (!isProformaStatus(status)) {
        return NextResponse.json({ error: `Unknown proforma status "${status}".` }, { status: 400 });
      }
      const check = canTransition(existing.status as ProformaStatus, status);
      if (!check.ok) {
        return NextResponse.json({ error: check.reason }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No supported fields to update.' }, { status: 400 });
    }

    const proforma = await prisma.proforma.update({
      where: { id: targetId },
      data: updateData,
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    // Broadcast real-time event to open client portals and admin dashboards
    try {
      broadcastSystemEvent({
        type: proforma.status === 'CONFIRMED' ? 'PROFORMA_CONFIRMED' : 'PROFORMA_UPDATED',
        id: proforma.id,
        proformaNumber: proforma.proformaNumber,
        status: proforma.status,
        data: proforma,
      });
    } catch (evtErr) {
      console.warn('Could not broadcast system event:', evtErr);
    }

    return NextResponse.json(proforma);
  } catch (error) {
    console.error('Error updating proforma:', error);
    return NextResponse.json({ error: 'Failed to update proforma' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    await prisma.proforma.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proforma:', error);
    return NextResponse.json({ error: 'Failed to delete proforma' }, { status: 500 });
  }
}
