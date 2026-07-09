import { NextRequest, NextResponse } from 'next/server';

// Gate the entire site behind HTTP Basic Auth so it's reachable only by
// whoever has the credentials, even though the Railway domain is public.
// Set SITE_USERNAME / SITE_PASSWORD as environment variables to enable.
// If either is unset, the site stays fully open (no gate) — set both
// on Railway when you want to lock it down to yourself only.

export function middleware(req: NextRequest) {
  const user = process.env.SITE_USERNAME;
  const pass = process.env.SITE_PASSWORD;

  // No credentials configured → gate is off, behave normally.
  if (!user || !pass) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get('authorization');

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      const separatorIndex = decoded.indexOf(':');
      const suppliedUser = decoded.slice(0, separatorIndex);
      const suppliedPass = decoded.slice(separatorIndex + 1);

      if (suppliedUser === user && suppliedPass === pass) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="AI Festivals (private preview)"' },
  });
}

// Apply to every route except static assets, so the whole app is gated
// while Next.js internals still load correctly.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
