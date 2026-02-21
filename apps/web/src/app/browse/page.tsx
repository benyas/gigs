import type { Metadata } from 'next';
import { GigCard } from '@/components/GigCard';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
import { CategoryIcon, SearchIcon } from '@/components/Icons';
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
    Object.keys(p).forEach((k) => { if (!p[k]) delete p[k]; });
    const qs = new URLSearchParams(p).toString();
    return `/browse${qs ? '?' + qs : ''}`;
  }

  const hasFilters = Object.keys(params).some((k) => k !== 'page' && params[k]);

  return (
    <section className="section">
      <div className="container">
        {/* Search bar */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, var(--primary-900) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 2rem 1.75rem',
          marginBottom: '1.75rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.06), transparent 50%)',
            pointerEvents: 'none',
          }} />
          <h1 style={{
            fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.875rem',
            color: '#fff', position: 'relative',
          }}>
            Trouvez le service ideal
          </h1>
          <form action="/browse" method="GET" className="search-box" style={{ position: 'relative' }}>
            <SearchAutocomplete
              name="q"
              placeholder="Que recherchez-vous ?"
              className="form-input"
              style={{ flex: '2 1 250px' }}
              defaultValue={searchParams.q || ''}
            />
            <select name="cityId" className="form-input"
              style={{ flex: '1 1 150px' }}
              defaultValue={searchParams.cityId || ''}>
              <option value="">Toutes les villes</option>
              {cityList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="btn"
              style={{ background: '#fff', color: 'var(--primary)', fontWeight: 700, flex: '0 0 auto' }}>
              Rechercher
            </button>
          </form>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <Link href="/browse"
            className={`chip${!searchParams.categoryId ? ' active' : ''}`}>
            Tous
          </Link>
          {cats.map((c: any) => (
            <Link
              key={c.id}
              href={buildUrl({ categoryId: c.id, page: '1' })}
              className={`chip${searchParams.categoryId === c.id ? ' active' : ''}`}
            >
              {c.icon && <CategoryIcon icon={c.icon} size={16} />}
              {c.name}
            </Link>
          ))}
        </div>

        {/* Filters row */}
        <div style={{
          display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
          marginBottom: '1.5rem', alignItems: 'center',
        }}>
          <form action="/browse" method="GET"
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {searchParams.categoryId && <input type="hidden" name="categoryId" value={searchParams.categoryId} />}
            {searchParams.cityId && <input type="hidden" name="cityId" value={searchParams.cityId} />}
            {searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
            {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
            <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: 500 }}>Prix :</span>
            <input name="minPrice" type="number" placeholder="Min" className="form-input"
              style={{ width: 85, padding: '0.4rem 0.625rem', fontSize: '0.85rem' }}
              defaultValue={searchParams.minPrice || ''} />
            <span style={{ color: 'var(--gray-300)' }}>-</span>
            <input name="maxPrice" type="number" placeholder="Max" className="form-input"
              style={{ width: 85, padding: '0.4rem 0.625rem', fontSize: '0.85rem' }}
              defaultValue={searchParams.maxPrice || ''} />
            <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>MAD</span>
            <button type="submit" className="btn btn-outline btn-sm">Appliquer</button>
          </form>
          {hasFilters && (
            <Link href="/browse" className="btn btn-sm"
              style={{ color: 'var(--red-500)', background: 'var(--red-50)', border: '1px solid var(--red-100)' }}>
              Reinitialiser
            </Link>
          )}
        </div>

        {/* Results header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem',
        }}>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
            {meta.total} service{meta.total !== 1 ? 's' : ''} trouve{meta.total !== 1 ? 's' : ''}
            {searchParams.q && <> pour &quot;{searchParams.q}&quot;</>}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Trier :</span>
            {[
              { value: 'recent', label: 'Recents' },
              { value: 'price_asc', label: 'Prix +' },
              { value: 'price_desc', label: 'Prix -' },
              { value: 'rating', label: 'Avis' },
            ].map((opt) => (
              <Link
                key={opt.value}
                href={buildUrl({ sort: opt.value, page: '1' })}
                className={`chip${(searchParams.sort || 'recent') === opt.value ? ' active' : ''}`}
                style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Results */}
        {gigList.length > 0 ? (
          <div className="grid grid-3">
            {gigList.map((gig: any) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon"><SearchIcon size={48} /></div>
              <div className="empty-state-title">Aucun service trouve</div>
              <div className="empty-state-desc">
                Essayez de modifier vos filtres ou d&apos;elargir votre recherche.
              </div>
              <Link href="/browse" className="btn btn-primary">Voir tous les services</Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="pagination">
            {meta.page > 1 && (
              <Link href={buildUrl({ page: String(meta.page - 1) })} className="btn btn-outline btn-sm">
                &larr; Precedent
              </Link>
            )}
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={p === meta.page ? 'active' : ''}
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
