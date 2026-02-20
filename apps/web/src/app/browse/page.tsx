import { GigCard } from '@/components/GigCard';
import { gigs, categories as categoriesApi, cities as citiesApi } from '@/lib/api';
import Link from 'next/link';

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
    const qs = new URLSearchParams(p).toString();
    return `/browse?${qs}`;
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Parcourir les services</h1>

        <div className="filters">
          <form action="/browse" method="GET" style={{ display: 'contents' }}>
            <select name="categoryId" className="form-input" style={{ width: 'auto' }} defaultValue={searchParams.categoryId || ''}>
              <option value="">Toutes les catégories</option>
              {cats.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select name="cityId" className="form-input" style={{ width: 'auto' }} defaultValue={searchParams.cityId || ''}>
              <option value="">Toutes les villes</option>
              {cityList.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              name="q"
              type="text"
              placeholder="Rechercher..."
              className="form-input"
              style={{ width: 'auto', minWidth: 200 }}
              defaultValue={searchParams.q || ''}
            />
            <button type="submit" className="btn btn-primary btn-sm">Filtrer</button>
          </form>
        </div>

        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          {meta.total} service{meta.total !== 1 ? 's' : ''} trouvé{meta.total !== 1 ? 's' : ''}
        </p>

        {gigList.length > 0 ? (
          <div className="grid grid-3">
            {gigList.map((gig: any) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Aucun service trouvé</p>
            <Link href="/browse" className="btn btn-outline">Réinitialiser les filtres</Link>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={p === meta.page ? 'active' : ''}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
