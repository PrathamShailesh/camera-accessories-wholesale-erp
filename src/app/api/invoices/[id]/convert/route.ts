import { NextRequest, NextResponse } from 'next/server';
import { guardApi } from '@/lib/api-auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await guardApi(req, 'invoices.write');
  if (!auth.ok) return auth.response;

  try {
    return NextResponse.json({ error: 'Use /api/proformas/:id/convert for the database-backed conversion workflow.' }, { status: 410 });
  } catch (error: any) {
    console.error('Conversion Error:', error);
    return NextResponse.json({ error: error.message || 'Conversion failed' }, { status: 400 });
  }
}
