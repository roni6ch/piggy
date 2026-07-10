import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'piggy-stitch-theme'

export function useStitchTheme() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    const initial = stored === 'dark' ? true : stored === 'light' ? false : !!prefersDark
    setDark(initial)
    document.documentElement.classList.toggle('dark', initial)
  }, [])

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
      return next
    })
  }, [])

  return { dark, toggle }
}
