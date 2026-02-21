import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: '#fff', marginBottom: '0.75rem' }}>Gigs.ma</h3>
            <p>La marketplace de services a domicile au Maroc.</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>Categories</h4>
            <p><Link href="/browse?category=plomberie">Plomberie</Link></p>
            <p><Link href="/browse?category=electricite">Electricite</Link></p>
            <p><Link href="/browse?category=menage">Menage</Link></p>
            <p><Link href="/browse">Toutes les categories</Link></p>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>Villes</h4>
            <p><Link href="/browse?city=casablanca">Casablanca</Link></p>
            <p><Link href="/browse?city=rabat">Rabat</Link></p>
            <p><Link href="/browse?city=marrakech">Marrakech</Link></p>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>Gigs.ma</h4>
            <p><Link href="/a-propos">A propos</Link></p>
            <p><Link href="/faq">FAQ</Link></p>
            <p><Link href="/contact">Contact</Link></p>
            <p><Link href="/conditions">CGU</Link></p>
            <p><Link href="/confidentialite">Confidentialite</Link></p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Gigs.ma — Tous droits reserves
        </div>
      </div>
    </footer>
  );
}
