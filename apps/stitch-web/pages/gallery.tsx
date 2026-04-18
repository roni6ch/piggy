import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StitchShell } from '@/components/stitch-shell'

interface ScreenEntry {
  id: string
  title: string
  slug: string
  html: string | null
  screenshot: string | null
  ok: boolean
  error: string | null
}

interface Manifest {
  projectId: string
  projectTitle?: string
  fetchedAt?: string
  screens: ScreenEntry[]
}

export default function StitchGallery() {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/stitch-assets/manifest.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setManifest)
      .catch(() => setManifest(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Head>
        <title>Stitch assets · Piggy</title>
      </Head>
      <StitchShell active="home">
        <div className="space-y-6 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Stitch export gallery</h1>
            <p className="mt-2 text-sm text-[var(--stitch-on-surface-variant)]">
              Run <code className="rounded bg-[var(--stitch-surface-container)] px-1.5 py-0.5 text-xs">npm run fetch:stitch</code> at
              the repo root (valid <code className="text-xs">STITCH_API_KEY</code> required). Files appear under{' '}
              <code className="text-xs">public/stitch-assets/</code>.
            </p>
          </div>

          {loading && <p className="text-sm text-[var(--stitch-on-surface-variant)]">Loading manifest…</p>}

          {!loading && manifest === null && (
            <p className="rounded-2xl border border-dashed border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-low)] p-4 text-sm text-[var(--stitch-on-surface-variant)]">
              No manifest found. Run the fetch script after setting a valid Google Stitch API key.
            </p>
          )}

          {!loading && manifest && (
            <ul className="space-y-3">
              {manifest.screens.map((s) => (
                <li
                  key={s.slug}
                  className="rounded-2xl border border-[var(--stitch-outline-variant)] bg-[var(--stitch-surface-container-low)] p-4"
                >
                  <p className="font-medium text-[var(--stitch-on-surface)]">{s.title}</p>
                  <p className="mt-1 text-xs text-[var(--stitch-on-surface-variant)]">{s.slug}</p>
                  {s.error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{s.error}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.html && (
                      <a
                        className="rounded-full bg-[var(--stitch-primary)] px-3 py-1.5 text-sm font-medium text-[var(--stitch-on-primary)]"
                        href={`/stitch-assets/${s.slug}/${s.html}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open HTML
                      </a>
                    )}
                    {s.screenshot && (
                      <a
                        className="rounded-full border border-[var(--stitch-outline)] px-3 py-1.5 text-sm font-medium text-[var(--stitch-primary)]"
                        href={`/stitch-assets/${s.slug}/${s.screenshot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Screenshot
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link href="/" className="inline-block text-sm font-medium text-[var(--stitch-primary)]">
            ← Back to app
          </Link>
        </div>
      </StitchShell>
    </>
  )
}
