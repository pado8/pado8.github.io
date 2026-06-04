export default function ProjectCard({ project, t, lang }) {
  const statusLabel = {
    active:   t.projects.status_active,
    wip:      t.projects.status_wip,
    archived: t.projects.status_archived,
  }[project.status]

  return (
    <article className="project-card">
      {project.screenshot && (
        <div className="project-card__img-wrap">
          <img
            src={project.screenshot}
            alt={project.title[lang]}
            className="project-card__img"
            loading="lazy"
          />
        </div>
      )}
      <div className="project-card__body">
        <div className="project-card__header">
          <h3 className="project-card__title">{project.title[lang]}</h3>
          <div className="project-card__badges">
            <span className={`badge badge--${project.status}`}>{statusLabel}</span>
            {project.badge && (
              <span className="badge badge--count">↑ {project.badge} {t.projects.downloads_label}</span>
            )}
          </div>
        </div>

        <p className="project-card__desc">{project.desc[lang]}</p>

        <ul className="project-card__tags">
          {project.tags.map(tag => (
            <li key={tag} className="tech-tag">{tag}</li>
          ))}
        </ul>

        <div className="project-card__links">
          {project.github && (
            <a href={project.github} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--outline">
              &#8599; {t.projects.github}
            </a>
          )}
          {project.download && (
            <a href={project.download} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--primary">
              &#8595; {t.projects.download}
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className="btn btn--sm btn--outline">
              &#8599; {project.demoLabel?.[lang] ?? t.projects.demo}
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
