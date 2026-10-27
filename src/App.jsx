import { useEffect } from 'react'
import { useTheme } from './hooks/useTheme'
import { useLang } from './hooks/useLang'
import { translations } from './i18n'
import Header from './components/Header'
import Hero from './components/Hero'
import Sites from './components/Sites'
import Footer from './components/Footer'

function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLang()
  const t = translations[lang]

  // <html lang>·문서 제목·메타 설명을 활성 언어와 맞춘다 (정적 메타는 한국어, 토글하면 영어).
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.meta.title
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t.meta.description)
  }, [lang, t])

  return (
    <div className="app">
      <Header t={t} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} />
      <main>
        <Hero t={t} />
        <Sites t={t} lang={lang} />
      </main>
      <Footer t={t} />
    </div>
  )
}

export default App
