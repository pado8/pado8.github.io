export default function Hero({ t }) {
  return (
    <section className="hero" id="home">
      <div className="hero__inner">
        <p className="hero__greeting">{t.hero.greeting}</p>
        <h1 className="hero__name">{t.hero.name}</h1>
        <p className="hero__title">{t.hero.title}</p>
        <p className="hero__desc">{t.hero.desc}</p>
        <div className="hero__ctas">
          <a
            href="https://github.com/pado8"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
          >
            {t.hero.cta_github}
          </a>
          <a href="#contact" className="btn btn--outline">
            {t.hero.cta_contact}
          </a>
        </div>
      </div>
      <div className="hero__scroll-hint" aria-hidden="true">
        <span>▾</span>
      </div>
    </section>
  )
}
