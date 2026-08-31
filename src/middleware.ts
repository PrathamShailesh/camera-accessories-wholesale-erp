import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthPayload } from '@/lib/auth-token';
import {
  canAccessApi,
  canAccessPage,
  homePathForRole,
  isPublicPagePath,
  isUserRole,
  resolveApiAccess,
} from '@/lib/rbac';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');
  const token = req.cookies.get('erp_auth_token')?.value;
  const session = await verifyAuthPayload(token);
  const role = session && isUserRole(session.role) ? session.role : null;

  if (isApi) {
    const access = resolveApiAccess(pathname, req.method);

    if (access === 'public') {
      return NextResponse.next();
    }

    if (!session || !role) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (access !== 'authenticated' && !canAccessApi(role, pathname, req.method)) {
      return NextResponse.json(
        { error: 'Forbidden: your role cannot access this resource' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  if (isPublicPagePath(pathname)) {
    if (pathname === '/login' && role) {
      return NextResponse.redirect(new URL(homePathForRole(role), req.url));
    }
    return NextResponse.next();
  }

  if (pathname === '/') {
    if (!role) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.redirect(new URL(homePathForRole(role), req.url));
  }

  if (!role) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessPage(role, pathname)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}
