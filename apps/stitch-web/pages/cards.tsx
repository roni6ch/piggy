import Head from 'next/head'
import { StitchShell } from '@/components/stitch-shell'

export default function StitchCards() {
  return (
    <>
      <Head>
        <title>Cards · Piggy</title>
      </Head>
      <StitchShell active="cards">
        <div className="space-y-4 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight">Your cards</h1>
          <p className="text-sm text-[var(--stitch-on-surface-variant)]">
            Connect your cards here when this app is wired to the API.
          </p>
          <div className="rounded-3xl border border-dashed border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-low)] p-8 text-center text-[var(--stitch-on-surface-variant)]">
            No cards yet
          </div>
        </div>
      </StitchShell>
    </>
  )
}
