export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  if (process.env.NEXT_PUBLIC_LAUNCH_MODE === 'landing-only') {
    // Do not import the full page; return nothing so build doesn’t pull deps.
    return null
  }
  // Only import the heavy/real page when not landing-only
  const Mod = await import('./page.full')
  const Comp = Mod.default
  return <Comp />
}