const skills = [
  { name: 'React',         icon: '⚛️' },
  { name: 'Next.js',       icon: '▲' },
  { name: 'TypeScript',    icon: '\u{1F537}' },
  { name: 'Node.js',       icon: '\u{1F7E2}' },
  { name: 'Python',        icon: '\u{1F40D}' },
  { name: 'Tauri',         icon: '\u{1F980}' },
  { name: 'Supabase',      icon: '⚡' },
  { name: 'PostgreSQL',    icon: '\u{1F418}' },
  { name: 'Tailwind CSS',  icon: '\u{1F3A8}' },
  { name: 'Vite',          icon: '\u{1F680}' },
  { name: 'Git',           icon: '\u{1F4E6}' },
  { name: 'Claude',        icon: '\u{1F916}' },
  { name: 'AI Pair Programming', icon: '✨' },
]

export default function About({ t }) {
  return (
    <section className="about section-alt" id="about">
      <div className="container">
        <h2 className="section-title">{t.about.title}</h2>
        <div className="about__grid">
          <div className="about__bio">
            <p>{t.about.bio}</p>
          </div>
          <div>
            <p className="about__skills-label">{t.about.skills_title}</p>
            <ul className="skills-list">
              {skills.map(s => (
                <li key={s.name} className="skill-tag">
                  <span aria-hidden="true">{s.icon}</span>
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
