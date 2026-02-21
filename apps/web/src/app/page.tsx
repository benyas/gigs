import Link from 'next/link';
import { GigCard } from '@/components/GigCard';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
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
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Trouvez le bon prestataire,<br />pres de chez vous</h1>
          <p>
            Plombiers, electriciens, femmes de menage, photographes... Des milliers
            de professionnels verifies a travers tout le Maroc.
          </p>
          <form action="/browse" method="GET" className="search-box"
            style={{ maxWidth: 680, margin: '0 auto' }}>
            <SearchAutocomplete
              name="q"
              placeholder="Quel service cherchez-vous ?"
              className="form-input"
              style={{ flex: '2 1 200px' }}
            />
            <select name="cityId" className="form-input" style={{ flex: '1 1 140px' }}>
              <option value="">Toutes les villes</option>
              {cityList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-lg"
              style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700 }}>
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Categories */}
      {cats.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Categories populaires</h2>
            <div className="grid grid-4">
              {cats.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/browse?categoryId=${cat.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="card card-interactive" style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
                    <div style={{ fontSize: '2.25rem', marginBottom: '0.625rem' }}>{cat.icon}</div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{cat.name}</h3>
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                      {cat._count?.gigs || 0} services
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured gigs */}
      {featuredGigs.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h2 className="section-title">Services recents</h2>
            <div className="grid grid-3">
              {featuredGigs.map((gig: any) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link href="/browse" className="btn btn-outline btn-lg">
                Voir tous les services
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section style={{ background: 'var(--primary-50)', padding: '4.5rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.25px' }}>
            Comment ca marche ?
          </h2>
          <p style={{ color: 'var(--gray-500)', marginBottom: '2.5rem', maxWidth: 500, margin: '0 auto 2.5rem' }}>
            Trois etapes simples pour trouver votre prestataire ideal
          </p>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', maxWidth: 800, margin: '0 auto' }}>
            {[
              { num: '1', title: 'Cherchez', desc: 'Parcourez les categories ou recherchez un service specifique' },
              { num: '2', title: 'Comparez', desc: 'Consultez les profils, avis et tarifs des prestataires' },
              { num: '3', title: 'Reservez', desc: 'Choisissez une date et reservez en quelques clics' },
            ].map((step) => (
              <div key={step.num}>
                <div className="step-number">{step.num}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
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
                  <div className="card card-interactive" style={{ textAlign: 'center', padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.2rem' }}>{city.name}</h3>
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.825rem' }}>{city.region}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="hero" style={{ padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            Vous etes professionnel ?
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Rejoignez Gigs.ma et accedez a des milliers de clients dans votre ville. Inscription gratuite.
          </p>
          <Link href="/auth/register" className="btn btn-lg"
            style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700 }}>
            Devenir prestataire
          </Link>
        </div>
      </section>
    </>
  );
}
