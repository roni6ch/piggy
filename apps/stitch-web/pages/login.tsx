'use client';

import React from 'react';
import Head from 'next/head';

export default function LoginPage() {
  return (
    <div className="dark bg-surface font-body text-on-surface min-h-screen flex items-center justify-center p-6 selection:bg-primary/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[160px]"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-tertiary/10 rounded-full blur-[100px]"></div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .glass-panel {
          background: rgba(23, 26, 29, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .piggy-glow {
          box-shadow: 0 0 40px rgba(255, 107, 157, 0.08);
        }
        .input-focus-glow:focus {
          outline: none;
          border-color: #ff89ad;
          box-shadow: 0 0 0 1px #ff89ad, 0 0 12px rgba(255, 137, 173, 0.2);
        }
      `}</style>

      {/* Main Auth Canvas */}
      <main className="relative w-full max-w-[480px] z-10">
        {/* Header / Brand Anchor */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center shadow-[0_0_30px_rgba(255,107,157,0.3)] transform -rotate-6">
              <span 
                className="material-symbols-outlined text-white text-3xl" 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                savings
              </span>
            </div>
          </div>
          <h1 className="font-headline font-extrabold text-5xl tracking-tighter italic text-primary mb-2">Piggy</h1>
          <p className="text-on-surface-variant font-medium tracking-tight text-lg">Your wealth, precisely curated.</p>
        </header>

        {/* Auth Card */}
        <div className="glass-panel rounded-lg p-8 md:p-12 border border-white/5 piggy-glow">
          <div className="space-y-8">
            {/* Social Login Cluster */}
            <div className="space-y-4">
              <button className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 group">
                <img 
                  alt="Google" 
                  className="w-5 h-5" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0xwlm63nrW6kvu5ih-PEKS3dcT7Qp7QfG8inhpV9Vj3VN-62-68cNKZm8fotSM7dD9kRCJW9nAlJSyiobbuLF22X4aloDXAkoAc6rEni-H4TUpTDiJjRiCaF9YNVaCx3-nJKm8hfch2qoH8WL_aHQyG8-F4JpC2wRv_InWa2qh0Oim2Rzgg6usyudNgkqf_qQEgOW8q_cvwf8qRH4bzkCwKKtJIq9ILarMdvjSEluyKvxJufQHFxhWDyiy6adUcfqPZamGJf9uehX"
                />
                <span className="font-label font-semibold text-on-surface">Continue with Google</span>
              </button>
              <button className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 group">
                <span className="material-symbols-outlined text-on-surface text-xl">ios</span>
                <span className="font-label font-semibold text-on-surface">Continue with Apple</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
              <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest">or</span>
              <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
            </div>

            {/* Email Form */}
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-4">Email Address</label>
                <input 
                  className="w-full h-14 bg-surface-container-highest border-none rounded-full px-6 font-body text-on-surface placeholder:text-outline input-focus-glow transition-all" 
                  placeholder="name@luminous.com" 
                  type="email"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
                  <a className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity" href="#">Forgot?</a>
                </div>
                <input 
                  className="w-full h-14 bg-surface-container-highest border-none rounded-full px-6 font-body text-on-surface placeholder:text-outline input-focus-glow transition-all" 
                  placeholder="••••••••" 
                  type="password"
                />
              </div>
              <button 
                className="w-full h-16 bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline font-extrabold text-lg rounded-full shadow-[0_10px_30px_rgba(255,107,157,0.2)] hover:shadow-[0_15px_40px_rgba(255,107,157,0.3)] transition-all duration-300 active:scale-95 mt-4" 
                type="submit"
              >
                Sign In
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <footer className="mt-10 text-center">
            <p className="text-on-surface-variant font-medium">
              New to Piggy? 
              <a 
                className="text-secondary font-bold ml-1 hover:underline underline-offset-4 decoration-2 decoration-secondary/30 transition-all" 
                href="#"
              >
                Create Account
              </a>
            </p>
          </footer>
        </div>

        {/* System Status / Security Proof */}
        <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">AES-256 Encrypted</span>
          </div>
          <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">FCA Regulated</span>
          </div>
        </div>
      </main>

      {/* Decorative Corner Label */}
      <div className="fixed top-12 left-12 hidden lg:block origin-left -rotate-90">
        <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-outline-variant">
          Piggy Financial Ecosystem v2.04
        </span>
      </div>
    </div>
  );
}