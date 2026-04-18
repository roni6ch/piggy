import Head from 'next/head'
import { HomeScreen } from '@/components/home-screen'
import { StitchShell } from '@/components/stitch-shell'

export default function StitchHome() {
  return (
    <>
      <Head>
        <title>Piggy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <StitchShell active="home">
        <HomeScreen />
      </StitchShell>
    </>
  )
}
