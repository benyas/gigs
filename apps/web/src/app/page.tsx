import Link from 'next/link';
import { GigCard } from '@/components/GigCard';
import { gigs, categories as categoriesApi } from '@/lib/api';

export default async function HomePage() {
  let featuredGigs: any[] = [];
  let cats: any[] = [];

  try {
    const [gigsRes, catsRes] = await Promise.all([
      gigs.list({ perPage: '6' }),
      categoriesApi.list(),
    ]);
    featuredGigs = gigsRes.data;
    cats = catsRes;
  } catch {
    // API not available yet — render with empty data
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Trouvez le bon prestataire, près de chez vous</h1>
          <p>
            Plombiers, électriciens, femmes de ménage, photographes... Des milliers
            de professionnels vérifiés à travers tout le Maroc.
          </p>
          <Link href="/browse" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', background: 'white', color: '#059669' }}>
            Explorer les services
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Catégories populaires</h2>
          <div className="grid grid-4" style={{ marginBottom: '3rem' }}>
            {cats.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/browse?categoryId=${cat.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                  <h3 style={{ fontSize: '1rem' }}>{cat.name}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {cat._count?.gigs || 0} services
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {featuredGigs.length > 0 && (
            <>
              <h2 className="section-title">Services récents</h2>
              <div className="grid grid-3">
                {featuredGigs.map((gig: any) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link href="/browse" className="btn btn-outline">
                  Voir tous les services
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <section style={{ background: '#f0fdf4', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Comment ça marche ?</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3>1. Cherchez</h3>
              <p style={{ color: '#6b7280' }}>Parcourez les catégories ou recherchez un service spécifique</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <h3>2. Comparez</h3>
              <p style={{ color: '#6b7280' }}>Consultez les profils, avis et tarifs des prestataires</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3>3. Réservez</h3>
              <p style={{ color: '#6b7280' }}>Choisissez une date et réservez en quelques clics</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
