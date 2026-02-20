import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ color: '#fff', marginBottom: '0.75rem' }}>Gigs.ma</h3>
            <p>La marketplace de services à domicile au Maroc.</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>Catégories</h4>
            <p><Link href="/browse?category=plomberie">Plomberie</Link></p>
            <p><Link href="/browse?category=electricite">Électricité</Link></p>
            <p><Link href="/browse?category=menage">Ménage</Link></p>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '0.75rem' }}>Villes</h4>
            <p><Link href="/browse?city=casablanca">Casablanca</Link></p>
            <p><Link href="/browse?city=rabat">Rabat</Link></p>
            <p><Link href="/browse?city=marrakech">Marrakech</Link></p>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Gigs.ma — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}
