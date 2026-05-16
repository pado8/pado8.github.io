import { useTheme } from './hooks/useTheme'
import { useLang } from './hooks/useLang'
import { translations } from './i18n'
import Header from './components/Header'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Contact from './components/Contact'
import Footer from './components/Footer'

function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang } = useLang()
  const t = translations[lang]

  return (
    <div className="app">
      <Header t={t} theme={theme} toggleTheme={toggleTheme} lang={lang} toggleLang={toggleLang} />
      <main>
        <Hero t={t} />
        <About t={t} />
        <Projects t={t} lang={lang} />
        <Contact t={t} />
      </main>
      <Footer t={t} />
    </div>
  )
}

export default App
