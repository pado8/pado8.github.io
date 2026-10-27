export default function Footer({ t }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>{t.footer.copy} · <a href="/privacy/">{t.footer.privacy}</a></p>
      </div>
    </footer>
  )
}
