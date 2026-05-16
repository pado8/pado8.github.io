export default function Contact({ t }) {
  return (
    <section className="contact section-alt" id="contact">
      <div className="container contact__inner">
        <h2 className="section-title">{t.contact.title}</h2>
        <p className="contact__desc">{t.contact.desc}</p>
        <div className="contact__links">
          <a
            href="mailto:floe9235@gmail.com"
            className="btn btn--primary"
          >
            {t.contact.cta_email}
          </a>
          <a
            href="https://github.com/pado8"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--outline"
          >
            {t.contact.cta_github}
          </a>
        </div>
      </div>
    </section>
  )
}
