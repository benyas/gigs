import Link from 'next/link';
import { GigCard } from '@/components/GigCard';
import { gigs, categories as categoriesApi, cities as citiesApi } from '@/lib/api';

export default async function HomePage() {
  let featuredGigs: any[] = [];
  let cats: any[] = [];
  let cityList: any[] = [];

  try {
    const [gigsRes, catsRes, citiesRes] = await Promise.all([
      gigs.list({ perPage: '6' }),
      categoriesApi.list(),
      citiesApi.list(),
    ]);
    featuredGigs = gigsRes.data;
    cats = catsRes;
    cityList = citiesRes;
  } catch {
    // API not available yet
  }

  return (
    <>
      {/* Hero with search */}
      <section className="hero">
        <div className="container">
          <h1>Trouvez le bon prestataire, pres de chez vous</h1>
          <p>
            Plombiers, electriciens, femmes de menage, photographes... Des milliers
            de professionnels verifies a travers tout le Maroc.
          </p>
          <form action="/browse" method="GET" style={{
            display: 'flex', gap: '0.5rem', justifyContent: 'center',
            flexWrap: 'wrap', marginTop: '1.5rem', maxWidth: 650, marginLeft: 'auto', marginRight: 'auto',
          }}>
            <input
              name="q"
              type="text"
              placeholder="Quel service cherchez-vous ?"
              className="form-input"
              style={{ flex: '2 1 200px', borderColor: 'transparent', fontSize: '1rem' }}
            />
            <select name="cityId" className="form-input" style={{ flex: '1 1 140px', borderColor: 'transparent' }}>
              <option value="">Toutes les villes</option>
              {cityList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn" style={{ background: '#fff', color: '#059669', fontWeight: 600 }}>
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Categories populaires</h2>
          <div className="grid grid-4" style={{ marginBottom: '3rem' }}>
            {cats.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/browse?categoryId=${cat.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem', transition: 'transform 0.2s' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
                  <h3 style={{ fontSize: '1rem' }}>{cat.name}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {cat._count?.gigs || 0} services
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Featured gigs */}
          {featuredGigs.length > 0 && (
            <>
              <h2 className="section-title">Services recents</h2>
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

      {/* How it works */}
      <section style={{ background: '#f0fdf4', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '2rem' }}>Comment ca marche ?</h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>1</div>
              <h3>Cherchez</h3>
              <p style={{ color: '#6b7280' }}>Parcourez les categories ou recherchez un service specifique</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>2</div>
              <h3>Comparez</h3>
              <p style={{ color: '#6b7280' }}>Consultez les profils, avis et tarifs des prestataires</p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>3</div>
              <h3>Reservez</h3>
              <p style={{ color: '#6b7280' }}>Choisissez une date et reservez en quelques clics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      {cityList.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Villes desservies</h2>
            <div className="grid grid-4">
              {cityList.slice(0, 8).map((city: any) => (
                <Link
                  key={city.id}
                  href={`/browse?cityId=${city.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.25rem' }}>{city.name}</h3>
                    <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>{city.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA for providers */}
      <section style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '4rem 0', color: '#fff' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Vous etes professionnel ?</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}>
            Rejoignez Gigs.ma et accedez a des milliers de clients dans votre ville. Inscription gratuite.
          </p>
          <Link href="/auth/register" className="btn" style={{ background: '#fff', color: '#059669', fontWeight: 600, fontSize: '1.05rem' }}>
            Devenir prestataire
          </Link>
        </div>
      </section>
    </>
  );
}
