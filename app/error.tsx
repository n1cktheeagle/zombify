'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 560, padding: 24, border: '1px solid #00000020', background: '#fff' }}>
            <div style={{ fontFamily: 'monospace', color: '#b91c1c', marginBottom: 8 }}>UNCAUGHT ERROR</div>
            <h1 style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', fontSize: 20, marginBottom: 12 }}>
              Something went wrong
            </h1>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#444', whiteSpace: 'pre-wrap' }}>{error?.message}</p>
            {error?.digest && (
              <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#666' }}>Digest: {error.digest}</p>
            )}
            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
              <button onClick={() => reset()} style={{ padding: '8px 12px', border: '1px solid #000', background: '#000', color: '#fff', fontWeight: 700 }}>
                Try again
              </button>
              <button onClick={() => (window.location.href = '/')} style={{ padding: '8px 12px', border: '1px solid #000', background: '#fff', color: '#000' }}>
                Go home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 