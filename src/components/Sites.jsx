import { sites, categories } from '../data/sites'
import SiteCard from './SiteCard'

export default function Sites({ t, lang }) {
  return (
    <section className="projects" id="sites">
      <div className="container">
        <h2 className="section-title">{t.sites.title}</h2>
        {categories.map(c => {
          const list = sites.filter(s => s.category === c.id)
          if (list.length === 0) return null
          return (
            <div className="sites__group" id={c.id} key={c.id}>
              <h3 className="sites__group-title">
                {c.label[lang]} <span className="sites__group-count">{list.length}</span>
              </h3>
              <div className="projects__grid">
                {list.map(s => (
                  <SiteCard key={s.id} site={s} t={t} lang={lang} />
                ))}
              </div>
            </div>
          )
        })}

        <div className="sites__private" id="console">
          <h3 className="sites__group-title">{t.console.title}</h3>
          <p className="sites__private-desc">{t.console.desc}</p>
          <a href="https://console.aquapado.com/" className="btn btn--sm btn--outline" rel="noopener noreferrer">
            &#8599; {t.console.cta}
          </a>
        </div>
      </div>
    </section>
  )
}
