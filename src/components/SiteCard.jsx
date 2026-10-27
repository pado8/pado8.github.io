export default function SiteCard({ site, t, lang }) {
  const statusLabel = {
    active:   t.sites.status_active,
    wip:      t.sites.status_wip,
    archived: t.sites.status_archived,
  }[site.status]

  return (
    <article className="project-card">
      <div className="project-card__body">
        <div className="project-card__header">
          <h3 className="project-card__title">{site.title[lang]}</h3>
          <div className="project-card__badges">
            <span className={`badge badge--${site.status}`}>{statusLabel}</span>
          </div>
        </div>

        <p className="project-card__desc">{site.desc[lang]}</p>

        <ul className="project-card__tags">
          {site.tags.map(tag => (
            <li key={tag} className="tech-tag">{tag}</li>
          ))}
        </ul>

        <div className="project-card__links">
          {site.links.map(l => {
            const external = /^https?:\/\//.test(l.href)
            return (
              <a
                key={l.href}
                href={l.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className={`btn btn--sm ${l.primary ? 'btn--primary' : 'btn--outline'}`}
              >
                &#8599; {l.label[lang]}
              </a>
            )
          })}
        </div>
      </div>
    </article>
  )
}
