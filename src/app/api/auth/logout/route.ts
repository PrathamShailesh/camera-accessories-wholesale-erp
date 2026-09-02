import { NextRequest, NextResponse } from 'next/server';
import { invalidateAuthUserCache } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  invalidateAuthUserCache();
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('erp_auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return response;
}
