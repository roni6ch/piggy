import Head from 'next/head'
import { StitchShell } from '@/components/stitch-shell'

export default function StitchProfile() {
  return (
    <>
      <Head>
        <title>Profile · Piggy</title>
      </Head>
      <StitchShell active="profile">
        <div className="space-y-4 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Account settings and preferences will live here.
          </p>
        </div>
      </StitchShell>
    </>
  )
}
