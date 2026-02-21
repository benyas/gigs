import type { Metadata } from 'next';
import { GigCard } from '@/components/GigCard';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { gigs, categories as categoriesApi, cities as citiesApi } from '@/lib/api';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Parcourir les services',
  description: 'Trouvez des prestataires de services a domicile au Maroc. Filtrez par categorie, ville et prix.',
};

interface Props {
  searchParams: { [key: string]: string | undefined };
}

export default async function BrowsePage({ searchParams }: Props) {
  let gigList: any[] = [];
  let meta = { page: 1, totalPages: 1, total: 0 };
  let cats: any[] = [];
  let cityList: any[] = [];

  const params: Record<string, string> = {};
  if (searchParams.categoryId) params.categoryId = searchParams.categoryId;
  if (searchParams.cityId) params.cityId = searchParams.cityId;
  if (searchParams.minPrice) params.minPrice = searchParams.minPrice;
  if (searchParams.maxPrice) params.maxPrice = searchParams.maxPrice;
  if (searchParams.q) params.q = searchParams.q;
  if (searchParams.sort) params.sort = searchParams.sort;
  if (searchParams.page) params.page = searchParams.page;

  try {
    const [gigsRes, catsRes, citiesRes] = await Promise.all([
      gigs.list(params),
      categoriesApi.list(),
      citiesApi.list(),
    ]);
    gigList = gigsRes.data;
    meta = gigsRes.meta;
    cats = catsRes;
    cityList = citiesRes;
  } catch {
    // API not available
  }

  function buildUrl(overrides: Record<string, string>) {
    const p = { ...params, ...overrides };
    // Remove empty values
    Object.keys(p).forEach((k) => { if (!p[k]) delete p[k]; });
    const qs = new URLSearchParams(p).toString();
    return `/browse${qs ? '?' + qs : ''}`;
  }

  const hasFilters = Object.keys(params).some((k) => k !== 'page' && params[k]);

  return (
    <section className="section">
      <div className="container">
        {/* Search hero */}
        <div style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          borderRadius: 16, padding: '2rem', marginBottom: '2rem', color: '#fff',
        }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
            Trouvez le service ideal
          </h1>
          <form action="/browse" method="GET" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <SearchAutocomplete
              name="q"
              placeholder="Que recherchez-vous ? (plombier, electricien, menage...)"
              className="form-input"
              style={{ flex: '2 1 250px', borderColor: 'transparent' }}
              defaultValue={searchParams.q || ''}
            />
            <select name="cityId" className="form-input" style={{ flex: '1 1 150px', borderColor: 'transparent' }} defaultValue={searchParams.cityId || ''}>
              <option value="">Toutes les villes</option>
              {cityList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn" style={{ background: '#fff', color: '#059669', fontWeight: 600, flex: '0 0 auto' }}>
              Rechercher
            </button>
          </form>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <Link
            href="/browse"
            className={`btn btn-sm ${!searchParams.categoryId ? 'btn-primary' : 'btn-outline'}`}
          >
            Tous
          </Link>
          {cats.map((c: any) => (
            <Link
              key={c.id}
              href={buildUrl({ categoryId: c.id, page: '1' })}
              className={`btn btn-sm ${searchParams.categoryId === c.id ? 'btn-primary' : 'btn-outline'}`}
            >
              {c.icon && <span style={{ marginRight: '0.25rem' }}>{c.icon}</span>}
              {c.name}
            </Link>
          ))}
        </div>

        {/* Price filter row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
          <form action="/browse" method="GET" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Preserve existing filters */}
            {searchParams.categoryId && <input type="hidden" name="categoryId" value={searchParams.categoryId} />}
            {searchParams.cityId && <input type="hidden" name="cityId" value={searchParams.cityId} />}
            {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
            {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Prix :</span>
            <input
              name="minPrice"
              type="number"
              placeholder="Min"
              className="form-input"
              style={{ width: 90 }}
              defaultValue={searchParams.minPrice || ''}
            />
            <span style={{ color: '#9ca3af' }}>-</span>
            <input
              name="maxPrice"
              type="number"
              placeholder="Max"
              className="form-input"
              style={{ width: 90 }}
              defaultValue={searchParams.maxPrice || ''}
            />
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>MAD</span>
            <button type="submit" className="btn btn-outline btn-sm">Appliquer</button>
          </form>
          {hasFilters && (
            <Link href="/browse" className="btn btn-outline btn-sm" style={{ color: '#ef4444', borderColor: '#fecaca' }}>
              Reinitialiser
            </Link>
          )}
        </div>

        {/* Results count + sort */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0 }}>
            {meta.total} service{meta.total !== 1 ? 's' : ''} trouve{meta.total !== 1 ? 's' : ''}
            {searchParams.q && <> pour &quot;{searchParams.q}&quot;</>}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Trier par :</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {[
                { value: 'recent', label: 'Recents' },
                { value: 'price_asc', label: 'Prix +' },
                { value: 'price_desc', label: 'Prix -' },
                { value: 'rating', label: 'Avis' },
              ].map((opt) => (
                <Link
                  key={opt.value}
                  href={buildUrl({ sort: opt.value, page: '1' })}
                  className={`btn btn-sm ${(searchParams.sort || 'recent') === opt.value ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Results grid */}
        {gigList.length > 0 ? (
          <div className="grid grid-3">
            {gigList.map((gig: any) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>&#128269;</div>
              <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600 }}>Aucun service trouve</p>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Essayez de modifier vos filtres ou d&apos;elargir votre recherche.
              </p>
              <Link href="/browse" className="btn btn-primary">Voir tous les services</Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="pagination" style={{ marginTop: '2rem' }}>
            {meta.page > 1 && (
              <Link href={buildUrl({ page: String(meta.page - 1) })} className="btn btn-outline btn-sm">
                &larr; Precedent
              </Link>
            )}
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                style={{
                  padding: '0.5rem 1rem', borderRadius: 8,
                  background: p === meta.page ? 'var(--primary)' : '#fff',
                  color: p === meta.page ? '#fff' : 'inherit',
                  border: '1px solid var(--border)',
                  textDecoration: 'none',
                }}
              >
                {p}
              </Link>
            ))}
            {meta.page < meta.totalPages && (
              <Link href={buildUrl({ page: String(meta.page + 1) })} className="btn btn-outline btn-sm">
                Suivant &rarr;
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
