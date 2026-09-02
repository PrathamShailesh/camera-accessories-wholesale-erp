import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, redactSettings } from '@/lib/api-auth';
import { hasPermission } from '@/lib/rbac';

let cachedSettingsData: any = null;
let settingsCacheExpiresAt = 0;
const SETTINGS_CACHE_TTL_MS = 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const now = Date.now();

    if (!cachedSettingsData || now >= settingsCacheExpiresAt) {
      cachedSettingsData = await prisma.companySettings.findUnique({
        where: { id: 'global-settings' },
      });
      settingsCacheExpiresAt = now + SETTINGS_CACHE_TTL_MS;
    }

    return NextResponse.json(
      redactSettings(cachedSettingsData as any, Boolean(user), user?.role),
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
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
    cachedSettingsData = null;
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
