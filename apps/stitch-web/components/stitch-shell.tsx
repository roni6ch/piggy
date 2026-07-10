import Link from 'next/link'
import type { ReactNode } from 'react'
import { useStitchTheme } from '@/hooks/use-stitch-theme'

export type StitchTab = 'home' | 'explore' | 'cards' | 'profile'

interface StitchShellProps {
  children: ReactNode
  active: StitchTab
}

export function StitchShell({ children, active }: StitchShellProps) {
  const { dark, toggle } = useStitchTheme()

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Desktop Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between gap-8 border-b border-white/5 bg-black/80 px-8 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tighter text-pink-500">Piggy</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className={`text-sm font-medium ${active === 'home' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>Dashboard</Link>
            <Link href="/assets" className="text-sm font-medium text-gray-500 hover:text-gray-300">Assets</Link>
            <Link href="/market" className="text-sm font-medium text-gray-500 hover:text-gray-300">Market</Link>
          </nav>
        </div>

        <div className="flex flex-1 max-w-md mx-4 hidden lg:block">
           {/* Search in header is optional if it's on the page, but the image shows it */}
           <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <SearchIcon size={16} />
              </span>
              <input 
                className="w-full bg-[#1A1A1A] border-none rounded-full py-2 pl-10 pr-4 text-xs text-white placeholder:text-gray-500" 
                placeholder="What are the deals at Zara right now?" 
              />
           </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white"><GlobeIcon /></button>
          <button onClick={toggle} className="text-gray-400 hover:text-white">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button className="rounded-full bg-pink-500 px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90">
            Add Assets
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-8 pt-10">{children}</main>

      {/* Mobile Nav - keep it for mobile but hide on desktop */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-white/5 bg-black/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Main"
      >
        <div className="flex items-stretch justify-around px-2 pt-2">
          <TabLink href="/" label="Home" active={active === 'home'} icon={<HomeIcon />} />
          <TabLink href="/explore" label="Explore" active={active === 'explore'} icon={<CompassIcon />} />
          <TabLink href="/cards" label="Cards" active={active === 'cards'} icon={<CardIcon />} />
          <TabLink href="/profile" label="Profile" active={active === 'profile'} icon={<UserIcon />} />
        </div>
      </nav>
    </div>
  )
}

function TabLink({
  href,
  label,
  active,
  icon,
}: {
  href: string
  label: string
  active: boolean
  icon: ReactNode
}) {
  return (
    <Link
      href={href}
      className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-xs font-medium transition-colors ${
        active
          ? 'text-[var(--stitch-primary)]'
          : 'text-[var(--stitch-on-surface-variant)] hover:text-[var(--stitch-on-surface)]'
      }`}
    >
      <span className={active ? 'text-[var(--stitch-primary)]' : undefined}>{icon}</span>
      {label}
    </Link>
  )
}

function SunIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function CompassIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function CardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function SearchIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
