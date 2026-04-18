import Head from 'next/head'
import { ExploreScreen } from '@/components/explore-screen'
import { StitchShell } from '@/components/stitch-shell'

export default function StitchExplore() {
  return (
    <>
      <Head>
        <title>Explore · Piggy</title>
      </Head>
      <StitchShell active="explore">
        <ExploreScreen />
      </StitchShell>
    </>
  )
}
