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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (e.g. .png, .jpg, .svg, .json, .js, .css, .ico)
     */
    '/((?!_next/static|_next/image|_next/data|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|json|txt|woff|woff2|ttf)$).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Never intercept internal Next.js assets, public static files, or service worker
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname === '/manifest.json' ||
    pathname === '/pdflogo.png' ||
    pathname === '/Logo-Samples.png' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

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
