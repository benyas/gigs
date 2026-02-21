'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';

export default function AdminGigsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [gigsData, setGigsData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'admin') { router.push('/'); return; }
    fetchGigs();
  }, [user, token, loading, router, page, statusFilter]);

  function fetchGigs() {
    if (!token) return;
    setDataLoading(true);
    admin.gigs(token, page, statusFilter || undefined)
      .then((res) => { setGigsData(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }

  async function handleStatusChange(gigId: string, status: string) {
    if (!token) return;
    await admin.updateGigStatus(gigId, status, token);
    fetchGigs();
  }

  if (loading) return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;

  const statusColors: Record<string, string> = { active: 'badge-green', draft: 'badge-yellow', paused: 'badge-blue', archived: 'badge-yellow' };

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin" style={{ color: '#6b7280' }}>&larr; Administration</Link>
        </div>
        <h1 className="section-title">Services ({meta.total || 0})</h1>

        <div className="filters" style={{ marginBottom: '1.5rem' }}>
          <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="draft">Brouillon</option>
            <option value="paused">En pause</option>
            <option value="archived">Archivé</option>
          </select>
        </div>

        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : (
          <>
            {gigsData.map((gig) => (
              <div key={gig.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <Link href={`/gig/${gig.slug}`} style={{ fontWeight: 600 }}>{gig.title}</Link>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {gig.provider?.profile?.name} &middot; {gig.category?.name} &middot; {gig.city?.name} &middot; {gig.basePrice} MAD
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {gig._count?.bookings || 0} réservations &middot; Créé le {new Date(gig.createdAt).toLocaleDateString('fr-MA')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge ${statusColors[gig.status] || 'badge-yellow'}`}>{gig.status}</span>
                    <select
                      value={gig.status}
                      onChange={(e) => handleStatusChange(gig.id, e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    >
                      <option value="active">Actif</option>
                      <option value="paused">En pause</option>
                      <option value="archived">Archivé</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            {meta.totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 1rem', background: p === page ? 'var(--primary)' : 'white', color: p === page ? 'white' : 'inherit' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
