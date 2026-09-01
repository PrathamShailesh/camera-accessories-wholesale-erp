import { NextRequest, NextResponse } from 'next/server';
import { sendProformaEmail } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';
import { guardApi } from '@/lib/api-auth';
import { broadcastSystemEvent } from '@/lib/events-emitter';

export async function POST(req: NextRequest) {
  const auth = await guardApi(req, 'proformas.write');
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    let { proformaNumber, proformaId, customerEmail, customerName, grandTotal, appUrl } = body;

    // If proformaId is missing, attempt to find it by proformaNumber
    if (!proformaId && proformaNumber) {
      const found = await prisma.proforma.findUnique({
        where: { proformaNumber },
      });
      if (found) {
        proformaId = found.id;
        customerEmail = customerEmail || found.customerEmail;
        customerName = customerName || found.customerName;
      }
    }

    if (!proformaNumber || !proformaId || !customerEmail || !customerName || !grandTotal) {
      return NextResponse.json({ error: 'Missing required fields (proformaNumber, proformaId, customerEmail, customerName, grandTotal)' }, { status: 400 });
    }

    // Determine application base URL
    if (!appUrl) {
      const origin = req.headers.get('origin') || req.headers.get('referer');
      if (origin) {
        try {
          const parsed = new URL(origin);
          appUrl = parsed.origin;
        } catch {
          // fallback
        }
      }
    }

    const success = await sendProformaEmail(
      proformaNumber,
      proformaId,
      customerEmail,
      customerName,
      grandTotal,
      appUrl
    );

    if (success) {
      // Only transition status to SENT if current status is DRAFT
      const updatedProforma = await prisma.proforma.update({
        where: { id: proformaId },
        data: { status: 'SENT' },
      });

      try {
        broadcastSystemEvent({
          type: 'PROFORMA_UPDATED',
          id: proformaId,
          proformaNumber,
          status: 'SENT',
          data: updatedProforma,
        });
      } catch (evtErr) {
        console.warn('Could not broadcast email event:', evtErr);
      }

      return NextResponse.json({ success: true, message: 'Email sent successfully', proforma: updatedProforma });
    } else {
      return NextResponse.json({ error: 'Failed to send email. Please check SMTP credentials in Settings.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending proforma email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
