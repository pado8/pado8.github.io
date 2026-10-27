import { useState } from 'react'

// 기본 언어는 한국어 — 모아 둔 사이트가 전부 한국어 사용자 대상이다.
export function useLang() {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'ko'
    return localStorage.getItem('lang') || 'ko'
  })

  const toggle = () => {
    const next = lang === 'en' ? 'ko' : 'en'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  return { lang, toggle }
}
