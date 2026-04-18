/**
 * Download Stitch screen HTML + screenshots into apps/stitch-web/public/stitch-assets/
 *
 * Set STITCH_API_KEY (Google Cloud API key with Stitch API enabled) or STITCH_GOOGLE_API_KEY in .env.local.
 * If you use OAuth instead: STITCH_ACCESS_TOKEN + GOOGLE_CLOUD_PROJECT (see @google/stitch-sdk README).
 *
 * npm run fetch:stitch
 */

import { Stitch, StitchToolClient } from '@google/stitch-sdk'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function loadEnvLocal() {
  try {
    const p = path.join(ROOT, '.env.local')
    const raw = fs.readFileSync(p, 'utf8')
    for (const line of raw.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq < 1) continue
      const key = t.slice(0, eq).trim()
      let val = t.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1)
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    /* no .env.local */
  }
}

loadEnvLocal()

if (!process.env.STITCH_API_KEY && process.env.STITCH_GOOGLE_API_KEY)
  process.env.STITCH_API_KEY = process.env.STITCH_GOOGLE_API_KEY

const PROJECT_ID = '14173284532756628243'

const SCREENS = [
  { id: '8299c8d33db5460dab03ab810a1ec613', title: 'Home Dashboard Empty State - Expanded (Desktop)' },
  { id: 'asset-stub-assets-a087ae2c1f024a21a6512f8e3e60985d-1774135208802', title: 'Design System' },
  { id: 'a3823bb2db4a432688e079a41327203f', title: 'Home Dashboard - Full Width (Desktop)' },
  { id: 'eabc453f90f646fe9bd20eb997a55322', title: 'Home Dashboard - Assets V2 (Mobile)' },
  { id: 'f646a5ea072844fe8587a964cee03952', title: 'Home Dashboard Empty State (Mobile)' },
  { id: '53497775460f4ac2b279abc360fc7c32', title: 'Search Results - Empty State (Desktop)' },
  { id: 'c129ea02a208479a9d7128fb89533b59', title: 'Add & Manage Assets (Desktop)' },
  { id: '34640daac5d14350961eeb71a387067e', title: 'Add Assets - Simplified (Mobile)' },
  { id: 'da6b61c056d746b587d51799c9d73f44', title: 'Profile & Settings (Mobile)' },
  { id: 'fb2ec71cd3c64e86930d281764cae705', title: 'Profile & Settings (Desktop)' },
  { id: 'fc536aba2cec437abf80a8a8a6bd8c67', title: 'Search Results - Empty State (Mobile)' },
  { id: '49e58914a4514d55a22f9bd323f0d90c', title: 'Search Results - Seller Focused (Desktop)' },
  { id: '16b64d8d23b4437da44f1a90209aa5f2', title: 'Search Results - Beautiful Dark Mode (Mobile)' },
]

function slugify(index, title) {
  return `${String(index).padStart(2, '0')}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)}`
}

function extFromUrl(url, fallback) {
  try {
    const p = new URL(url).pathname
    const m = p.match(/\.(webp|png|jpg|jpeg|gif|svg)(?:\?|$)/i)
    if (m) return m[1].toLowerCase()
  } catch {
    /* ignore */
  }
  return fallback
}

async function downloadWithFetch(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true })
  await fs.promises.writeFile(destPath, buf)
}

function downloadWithCurl(url, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  execFileSync('curl', ['-fsSL', url, '-o', destPath], { stdio: 'inherit' })
}

async function download(url, destPath) {
  if (!url) return false
  try {
    await downloadWithFetch(url, destPath)
    return true
  } catch (e) {
    console.warn(`fetch failed (${e.message}), trying curl -L …`)
    try {
      downloadWithCurl(url, destPath)
      return true
    } catch (e2) {
      console.error(`curl failed: ${e2.message}`)
      return false
    }
  }
}

/** One client per screen avoids MCP transport reuse bugs after API errors. */
async function fetchOneScreen(projectId, screenId) {
  const client = new StitchToolClient({ apiKey: process.env.STITCH_API_KEY })
  try {
    const project = new Stitch(client).project(projectId)
    const screen = await project.getScreen(screenId)
    const htmlUrl = await screen.getHtml()
    const imageUrl = await screen.getImage()
    return { htmlUrl, imageUrl }
  } finally {
    await client.close()
  }
}

async function main() {
  if (!process.env.STITCH_API_KEY) {
    console.error('Missing STITCH_API_KEY (or STITCH_GOOGLE_API_KEY in .env.local)')
    process.exit(1)
  }

  const outRoot = path.join(ROOT, 'apps', 'stitch-web', 'public', 'stitch-assets')
  await fs.promises.mkdir(outRoot, { recursive: true })

  const manifest = {
    projectId: PROJECT_ID,
    projectTitle: 'Auth Page (Mobile)',
    fetchedAt: new Date().toISOString(),
    screens: [],
  }

  for (let i = 0; i < SCREENS.length; i++) {
    const { id, title } = SCREENS[i]
    const slug = slugify(i + 1, title)
    const dir = path.join(outRoot, slug)
    const entry = {
      id,
      title,
      slug,
      html: null,
      screenshot: null,
      ok: false,
      error: null,
    }

    if (id.startsWith('asset-stub-')) {
      entry.error = 'Skipped: design-system stub — export design systems via Stitch UI or API separately'
      manifest.screens.push(entry)
      console.warn(`Skip ${slug}`)
      continue
    }

    try {
      const { htmlUrl, imageUrl } = await fetchOneScreen(PROJECT_ID, id)

      if (htmlUrl) {
        const ok = await download(htmlUrl, path.join(dir, 'screen.html'))
        entry.html = ok ? 'screen.html' : null
      }
      if (imageUrl) {
        const ext = extFromUrl(imageUrl, 'png')
        const shot = `screenshot.${ext}`
        const ok = await download(imageUrl, path.join(dir, shot))
        entry.screenshot = ok ? shot : null
      }

      entry.ok = !!(entry.html || entry.screenshot)
      console.log(entry.ok ? `OK ${slug}` : `Partial ${slug}`)
    } catch (e) {
      const msg = e.message || String(e)
      entry.error = msg
      console.error(`Fail ${slug}:`, msg)
    }

    manifest.screens.push(entry)
  }

  await fs.promises.writeFile(path.join(outRoot, 'manifest.json'), JSON.stringify(manifest, null, 2))
  const anyOk = manifest.screens.some((s) => s.ok)
  console.log('\nOutput:', outRoot)
  console.log('Gallery: http://localhost:3001/gallery')
  if (!anyOk) {
    console.warn('\nNo assets downloaded. Use a valid STITCH_API_KEY (with Stitch API enabled) or OAuth: STITCH_ACCESS_TOKEN + GOOGLE_CLOUD_PROJECT.')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
