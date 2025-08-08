export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import FeedbackV2Client from './feedback-client';

export default function Page({ params }: { params: { id: string } }) {
  return <FeedbackV2Client params={params} />;
} 