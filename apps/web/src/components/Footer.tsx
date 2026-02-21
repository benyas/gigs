import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h3 style={{ fontSize: '1.25rem', letterSpacing: '-0.25px' }}>Gigs.ma</h3>
            <p style={{ lineHeight: 1.7, marginBottom: '1rem' }}>
              La marketplace de services a domicile au Maroc. Trouvez le bon prestataire, en quelques clics.
            </p>
          </div>
          <div>
            <h4>Categories</h4>
            <div className="footer-links">
              <Link href="/browse?category=plomberie">Plomberie</Link>
              <Link href="/browse?category=electricite">Electricite</Link>
              <Link href="/browse?category=menage">Menage</Link>
              <Link href="/browse">Toutes les categories</Link>
            </div>
          </div>
          <div>
            <h4>Villes</h4>
            <div className="footer-links">
              <Link href="/browse?city=casablanca">Casablanca</Link>
              <Link href="/browse?city=rabat">Rabat</Link>
              <Link href="/browse?city=marrakech">Marrakech</Link>
            </div>
          </div>
          <div>
            <h4>A propos</h4>
            <div className="footer-links">
              <Link href="/a-propos">A propos</Link>
              <Link href="/faq">FAQ</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/conditions">CGU</Link>
              <Link href="/confidentialite">Confidentialite</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} Gigs.ma — Tous droits reserves
        </div>
      </div>
    </footer>
  );
}
