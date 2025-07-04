// This file should be at: app/feedback/[id]/page.tsx

// These lines tell Next.js to not cache this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Import your actual feedback component
import FeedbackPage from './feedback-client';

// This is a simple wrapper that just passes the params to your real component
export default function Page({ params }: { params: { id: string } }) {
  return <FeedbackPage params={params} />;
}