import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { ThemeToggle } from '@/common/components/theme-toggle'
import { UploadVoucherApp } from '@/common/components/upload-voucher-app'

export function UploadVoucherShell() {
  const { resolvedTheme } = useTheme()
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <div
      className={`min-h-screen w-full font-body selection:bg-primary/30 transition-colors duration-300 ${
        isDark ? 'bg-[#0c0e11] text-[#e8e8ec]' : 'bg-slate-50 text-gray-900'
      }`}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className={`absolute -left-24 -top-24 h-96 w-96 rounded-full blur-[120px] ${
            isDark ? 'bg-[#ff89ad]/10' : 'bg-[#ff89ad]/5'
          }`}
        />
        <div className="absolute -right-48 top-1/2 h-[500px] w-[500px] rounded-full bg-[#59faba]/5 blur-[160px]" />
        <div
          className={`absolute bottom-0 left-1/4 h-64 w-64 rounded-full blur-[100px] ${
            isDark ? 'bg-[#9de1ff]/10' : 'bg-[#9de1ff]/5'
          }`}
        />
      </div>

      <div className="relative mx-auto w-full max-w-screen-xl px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>

        <header className="mb-8 text-center md:mb-12">
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="flex h-14 w-14 -rotate-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-container shadow-[0_0_30px_rgba(255,107,157,0.3)]">
              <span className="text-3xl" role="img" aria-label="Piggy">🐷</span>
            </div>
          </div>
          <h1 className="font-headline text-3xl font-extrabold italic tracking-tighter text-primary sm:text-5xl">
            Piggy
          </h1>
          <p className={`mt-2 text-base font-medium sm:text-lg ${isDark ? 'text-[#aaabaf]' : 'text-gray-500'}`}>
            Upload Voucher — your deals, one secure wallet
          </p>
        </header>

        <main className="mx-auto max-w-2xl">
          {status !== 'loading' && !session?.user?.email && (
            <div
              className={`mb-6 rounded-2xl border px-4 py-4 text-sm ${
                isDark ? 'border-primary/30 bg-primary/10 text-[#e8e8ec]' : 'border-primary/20 bg-primary/5 text-gray-800'
              }`}
            >
              <p className="font-semibold text-primary">Sign in to save vouchers</p>
              <p className={`mt-1 ${isDark ? 'text-[#aaabaf]' : 'text-gray-600'}`}>
                Your vouchers are saved to Firebase when you&apos;re signed in.
              </p>
              <Link
                href="/auth/login?callbackUrl=/"
                className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container px-5 font-label font-semibold text-on-primary transition-all active:scale-95"
              >
                Sign in
              </Link>
            </div>
          )}

          {session?.user?.email && (
            <p className={`mb-4 text-center text-xs ${isDark ? 'text-[#747579]' : 'text-gray-400'}`}>
              Saving to cloud as {session.user.email}
            </p>
          )}

          <UploadVoucherApp isDark={isDark} />

          <p className={`mt-8 text-center text-xs ${isDark ? 'text-[#747579]' : 'text-gray-400'}`}>
            Your codes are encrypted and never shared with third parties.
          </p>
        </main>
      </div>
    </div>
  )
}
