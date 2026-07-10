import { useMemo } from 'react'

export function HomeScreen() {
  return (
    <div className="space-y-10 pb-12">
      {/* Search Header (if not in Shell) */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="What are the deals at Zara right now?"
            className="w-full rounded-full bg-[#1A1A1A] border-none py-3 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 focus:ring-2 focus:ring-pink-500/50"
          />
        </div>
      </div>

      {/* Hero: Your Piggy Bank */}
      <section className="relative overflow-hidden rounded-3xl bg-[#121212] p-8 border border-white/5">
        <div className="relative z-10 max-w-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
            <BankIcon />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">Your Piggy Bank</h1>
          <p className="text-lg text-gray-400 leading-relaxed mb-8">
            Start your wealth journey by connecting your first asset. We'll track your deals, growth, and savings in real-time. Connect your accounts to see a unified view of your financial health.
          </p>
          <button className="flex items-center gap-2 rounded-full bg-pink-500 px-6 py-3 font-semibold text-white transition-transform hover:scale-105 active:scale-95">
            Add Your First Asset
            <ArrowRightIcon />
          </button>
        </div>
        {/* Piggy Illustration Placeholder */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-20 hidden md:block">
           <PiggyIcon size={240} />
        </div>
      </section>

      {/* Top Deals */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500 mb-1">Curated for you</p>
            <h2 className="text-2xl font-bold text-white">Top Deals of the Month</h2>
          </div>
          <button className="text-sm font-medium text-gray-400 hover:text-white">View All Deals ↗</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nike Featured Card */}
          <div className="group relative h-80 overflow-hidden rounded-3xl bg-[#1A1A1A]">
            <img 
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800" 
              alt="Nike"
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="mb-3 inline-block rounded-full bg-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Flash Deal
              </span>
              <h3 className="text-3xl font-bold text-white">60% OFF Summer at Nike House</h3>
            </div>
          </div>

          {/* Apple/Tech Card */}
          <div className="group relative h-80 overflow-hidden rounded-3xl bg-[#1A1A1A]">
            <img 
              src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=800" 
              alt="Tech"
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="mb-3 inline-block rounded-full bg-cyan-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Premium Tech
              </span>
              <h3 className="text-3xl font-bold text-white">30% OFF Apple Store</h3>
              <p className="mt-2 text-sm text-gray-400">Ends in 2 days</p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-[#121212] p-8 border border-white/5">
           <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black font-bold text-xs uppercase">
              Zara
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Exclusive Early Access</h3>
           <p className="text-gray-400 text-sm mb-6">Members get 15% extra on the new Spring Collection.</p>
           <button className="w-full rounded-xl border border-white/10 py-3 text-sm font-semibold text-white hover:bg-white/5 transition-colors">
             Claim Invite
           </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-[#121212] p-8 border border-white/5">
           <img 
              src="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=800" 
              alt="Resort"
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
           <div className="relative z-10">
             <h3 className="text-xl font-bold text-white mb-2">Wanderlust Rewards</h3>
             <p className="text-gray-400 text-sm mb-6 max-w-[200px]">Unlock secret hotel rates up to 45% off in Bali and Santorini.</p>
             <button className="rounded-full bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-400 border border-cyan-500/30">
               Explore Flights
             </button>
           </div>
        </div>
      </section>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function BankIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 10v11" />
      <path d="M19 10v11" />
      <path d="M10 10v11" />
      <path d="M14 10v11" />
      <path d="M2 10l10-8 10 8" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function PiggyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-pink-500">
      <path d="M19 9c0-3.31-2.69-6-6-6S7 5.69 7 9c0 .69.12 1.35.33 1.96C5.17 11.45 4 13.08 4 15c0 2.21 1.79 4 4 4h1v2h2v-2h6v2h2v-2h1c2.21 0 4-1.79 4-4 0-1.92-1.17-3.55-3.33-4.04.21-.61.33-1.27.33-1.96zM13 5c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z" />
    </svg>
  )
}

