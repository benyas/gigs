'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { favorites } from '@/lib/api';
import { GigCard } from '@/components/GigCard';

export default function FavoritesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }

    setFetching(true);
    favorites.list(token, page)
      .then((res) => {
        setData(res.data || []);
        setMeta(res.meta);
      })
      .catch(() => setData([]))
      .finally(() => setFetching(false));
  }, [user, token, loading, router, page]);

  if (loading || fetching) {
    return (
      <section className="section">
        <div className="container">
          <div className="skeleton" style={{ height: 28, width: 200, marginBottom: '1.5rem' }} />
          <div className="grid grid-3" style={{ gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.25px' }}>
          Mes favoris
        </h1>

        {data.length > 0 ? (
          <>
            <div className="grid grid-3" style={{ gap: '1rem' }}>
              {data.map((fav: any) => (
                <GigCard key={fav.id} gig={fav.gig || fav} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Precedent
                </button>
                <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  {page} / {meta.totalPages}
                </span>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-title">Aucun favori</div>
              <div className="empty-state-desc">
                Cliquez sur le coeur d&apos;un service pour l&apos;ajouter a vos favoris.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
