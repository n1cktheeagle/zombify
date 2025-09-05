## Analytics

This project uses Vercel Web Analytics for pageviews and custom events.

- The root layout mounts the analytics script once:
  - `app/layout.tsx` imports `Analytics` from `@vercel/analytics/react` and renders it near the end of `<body>` (outside providers).
- Events are sent with `track` from `@vercel/analytics` (e.g., `alpha_signup` in `app/landing/page.tsx`). No PII is included in event payloads.
- Pageviews and events appear in Vercel after a production deployment. In development, analytics run in debug mode and may log locally.

Environment notes:
- Analytics run automatically in production on Vercel. No additional configuration required.
