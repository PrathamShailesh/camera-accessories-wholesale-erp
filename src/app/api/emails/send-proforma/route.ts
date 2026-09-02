import { NextRequest, NextResponse } from 'next/server';
import { sendProformaEmail } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';
import { broadcastSystemEvent } from '@/lib/events-emitter';

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { proformaId, proformaNumber } = body as { proformaId?: string; proformaNumber?: string };

    const identifier = proformaId || proformaNumber;
    if (!identifier) {
      return NextResponse.json({ error: 'A proformaId or proformaNumber is required.' }, { status: 400 });
    }

    const proforma = await prisma.proforma.findFirst({
      where: { OR: [{ id: identifier }, { proformaNumber: identifier }] },
      select: { id: true, proformaNumber: true, status: true },
    });

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma not found' }, { status: 404 });
    }

    // Determine application base URL for the "view / download PDF" link.
    let appUrl: string | undefined = body.appUrl;
    if (!appUrl) {
      const origin = req.headers.get('origin') || req.headers.get('referer');
      if (origin) {
        try {
          appUrl = new URL(origin).origin;
        } catch {
          /* fall back to the configured default */
        }
      }
    }

    // Line items and totals are read from the database inside sendProformaEmail,
    // so the email can never disagree with the stored document.
    const result = await sendProformaEmail(proforma.id, appUrl);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 502 });
    }

    // Only advance DRAFT -> SENT. Re-sending a confirmed quotation must not drag
    // it backwards, so this checks the current status directly rather than using
    // canTransition (which intentionally permits CONFIRMED -> SENT as a manual
    // correction, but that must never happen as a side effect of emailing).
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
      } catch (evtErr) {
        console.warn('Could not broadcast email event:', evtErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      recipient: result.recipient,
      simulated: result.simulated ?? false,
      statusChanged: Boolean(updatedProforma),
      proforma: updatedProforma,
    });
  } catch (error) {
    console.error('Error sending proforma email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
