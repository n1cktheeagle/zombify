import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public paths that should never be redirected
  if (
    pathname === '/' ||
    pathname === '/landing' ||
    pathname.startsWith('/api/alpha') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next()
  }

  // Default: allow through (no rewrites)
  return NextResponse.next()
}

export const config = {
  // Match all paths by default
  matcher: '/:path*',
}


