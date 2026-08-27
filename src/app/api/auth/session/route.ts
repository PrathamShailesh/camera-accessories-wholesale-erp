import { NextRequest, NextResponse } from 'next/server';
import dataStore from '@/lib/data-store';

export async function GET() {
  const user = dataStore.getCurrentUser();
  return NextResponse.json({ success: true, user });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    dataStore.setCurrentUser(userId);
    const user = dataStore.getCurrentUser();

    dataStore.addAuditLog({
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      entityLabel: `${user.name} (${user.role})`,
      description: `Active session switched to ${user.name} (${user.role}${user.assignedDepotName ? ` @ ${user.assignedDepotName}` : ''})`,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
