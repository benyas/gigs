'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { disputes } from '@/lib/api';

const STATUS_LABELS: Record<string, { label: string; class: string }> = {
  open: { label: 'Ouvert', class: 'badge-yellow' },
  resolved: { label: 'Resolu', class: 'badge-green' },
  closed: { label: 'Ferme', class: 'badge-red' },
};

export default function DisputesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }

    setFetching(true);
    disputes.list(token, page)
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
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="skeleton" style={{ height: 28, width: 200, marginBottom: '1.5rem' }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 80, marginBottom: '0.75rem', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.25px' }}>
          Mes litiges
        </h1>

        {data.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {data.map((dispute: any) => {
                const status = STATUS_LABELS[dispute.status] || { label: dispute.status, class: '' };
                return (
                  <Link key={dispute.id} href={`/dashboard/disputes/${dispute.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="card card-interactive">
                      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                            Litige #{dispute.id.slice(-6)}
                          </div>
                          <div style={{ fontSize: '0.825rem', color: 'var(--gray-500)', lineHeight: 1.5 }}>
                            {dispute.reason?.slice(0, 80)}{dispute.reason?.length > 80 ? '...' : ''}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.25rem' }}>
                            {new Date(dispute.createdAt).toLocaleDateString('fr-MA')}
                          </div>
                        </div>
                        <span className={`badge ${status.class}`}>{status.label}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {meta && meta.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Precedent
                </button>
                <span style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                  {page} / {meta.totalPages}
                </span>
                <button className="btn btn-outline btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>
                  Suivant
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-title">Aucun litige</div>
              <div className="empty-state-desc">
                Vous n&apos;avez ouvert aucun litige pour le moment.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
