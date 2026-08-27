import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const results = dataStore.searchGlobal(q);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
