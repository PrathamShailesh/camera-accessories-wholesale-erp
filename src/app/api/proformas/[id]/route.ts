import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastSystemEvent } from '@/lib/events-emitter';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
  try {
    const body = await req.json();
    const { status, notes } = body;

    // Find id if params.id was proformaNumber
    let targetId = params.id;
    const existing = await prisma.proforma.findFirst({
      where: {
        OR: [{ id: params.id }, { proformaNumber: params.id }],
      },
    });

    if (existing) {
      targetId = existing.id;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const proforma = await prisma.proforma.update({
      where: { id: targetId },
      data: Object.keys(updateData).length > 0 ? updateData : body,
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
