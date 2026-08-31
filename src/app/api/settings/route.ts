import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, redactSettings } from '@/lib/api-auth';
import { hasPermission } from '@/lib/rbac';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const settings = await prisma.companySettings.findUnique({
      where: { id: 'global-settings' },
    });
    return NextResponse.json(redactSettings(settings as any, Boolean(user), user?.role));
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasPermission(user.role, 'settings.write')) {
      return NextResponse.json({ error: 'Forbidden: only Super Admin can update settings' }, { status: 403 });
    }

    const body = await req.json();
    const settings = await prisma.companySettings.update({
      where: { id: 'global-settings' },
      data: body,
    });

    return NextResponse.json(redactSettings(settings as any, true, user.role));
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
