import { NextRequest, NextResponse } from 'next/server';
import { sendProformaEmail } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';
import { broadcastSystemEvent } from '@/lib/events-emitter';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  const { id } = params;

  try {
    const proforma = await prisma.proforma.findFirst({
      where: { OR: [{ id }, { proformaNumber: id }] },
      select: { id: true, proformaNumber: true, status: true },
    });

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma quotation not found' }, { status: 404 });
    }

    let appUrl: string | undefined;
    const origin = req.headers.get('origin') || req.headers.get('referer');
    if (origin) {
      try {
        appUrl = new URL(origin).origin;
      } catch {}
    }

    const result = await sendProformaEmail(proforma.id, appUrl);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 502 });
    }

    let updatedProforma = null;
    if (proforma.status === 'DRAFT') {
      updatedProforma = await prisma.proforma.update({
        where: { id: proforma.id },
        data: { status: 'SENT' },
      });

      try {
        broadcastSystemEvent({
          type: 'PROFORMA_UPDATED',
          id: proforma.id,
          proformaNumber: proforma.proformaNumber,
          status: 'SENT',
          data: updatedProforma,
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      recipient: result.recipient,
      simulated: result.simulated ?? false,
      statusChanged: Boolean(updatedProforma),
      proforma: updatedProforma,
    });
  } catch (error: any) {
    console.error('Error sending proforma email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
