export default function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          {t.footer.copy}
          {' · '}<a href="mailto:floe9235@gmail.com">{t.footer.contact}</a>
          {' · '}<a href="/privacy/">{t.footer.privacy}</a>
          {' · '}<a href="https://console.aquapado.com/" rel="noopener noreferrer">{t.footer.console}</a>
        </p>
      </div>
    </footer>
  )
}
