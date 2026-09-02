import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, publicUserView } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: publicUserView(user),
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=60',
        },
      }
    );
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
}
