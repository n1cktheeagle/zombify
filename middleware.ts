import { NextResponse, NextRequest } from 'next/server'

// Middleware to optionally restrict the app to a landing-only mode.
// In landing-only mode, only allow specific paths and rewrite everything else to /landing
export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const pathname = url.pathname

  const isLandingOnly = process.env.NEXT_PUBLIC_LAUNCH_MODE === 'landing-only'
  if (!isLandingOnly) {
    return NextResponse.next()
  }

  // Allow Next.js internals
  if (pathname.startsWith('/_next')) {
    return NextResponse.next()
  }

  // Allow static assets by common extensions
  const staticAssetPattern = /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff|woff2)(?:\?.*)?$/i
  if (staticAssetPattern.test(pathname)) {
    return NextResponse.next()
  }

  // Allow explicit paths
  const allowedExactPaths = new Set([
    '/',
    '/landing',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ])
  if (allowedExactPaths.has(pathname)) {
    return NextResponse.next()
  }

  // Allow API for alpha signups
  if (pathname === '/api/alpha') {
    return NextResponse.next()
  }

  // Everything else rewrites to /landing
  const rewriteUrl = url.clone()
  rewriteUrl.pathname = '/landing'
  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  // Match all paths except static files handled above; middleware runs and will early-return
  matcher: ['/((?!_next).*)'],
}


