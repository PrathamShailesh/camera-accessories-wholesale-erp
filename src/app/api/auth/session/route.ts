import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, publicUserView } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true, user: publicUserView(user) });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Session switching is disabled. Sign in with the target account.' },
    { status: 403 }
  );
}
