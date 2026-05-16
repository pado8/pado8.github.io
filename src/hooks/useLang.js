import { useState } from 'react'

export function useLang() {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en'
    return localStorage.getItem('lang') || 'en'
  })

  const toggle = () => {
    const next = lang === 'en' ? 'ko' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return { lang, toggle }
}
