import { projects } from '../data/projects'
import ProjectCard from './ProjectCard'

export default function Projects({ t, lang }) {
  return (
    <section className="projects" id="projects">
      <div className="container">
        <h2 className="section-title">{t.projects.title}</h2>
        <div className="projects__grid">
          {projects.map(p => (
            <ProjectCard key={p.id} project={p} t={t} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}
