export const dynamic = "force-dynamic"
export const revalidate = 0

if (process.env.NEXT_PUBLIC_LAUNCH_MODE === "landing-only") {
  // eslint-disable-next-line import/no-anonymous-default-export
  export default function Placeholder() { return null }
}

import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return <Dashboard />;
}