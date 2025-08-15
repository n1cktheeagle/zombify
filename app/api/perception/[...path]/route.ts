export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

async function forward(req: Request, { params }: { params: { path?: string[] } }) {
  const path = (params.path ?? []).join('/');
  const url = `http://127.0.0.1:8090/${path}`;

  const headers = new Headers(req.headers);
  headers.delete('host');

  let body: BodyInit | undefined = undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  try {
    const resp = await fetch(url, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });

    const passthroughHeaders = new Headers(resp.headers);
    passthroughHeaders.set('cache-control', 'no-store');

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: passthroughHeaders,
    });
  } catch (_e) {
    return NextResponse.json({ ok: false, error: 'connection_refused' }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };


