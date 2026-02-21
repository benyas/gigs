'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';

export default function AdminBookingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'admin') { router.push('/'); return; }
    fetchBookings();
  }, [user, token, loading, router, page, statusFilter]);

  function fetchBookings() {
    if (!token) return;
    setDataLoading(true);
    admin.bookings(token, page, statusFilter || undefined)
      .then((res) => { setBookingsData(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }

  if (loading) return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;

  const statusLabels: Record<string, string> = {
    pending: 'En attente', accepted: 'Acceptée', in_progress: 'En cours',
    completed: 'Terminée', cancelled: 'Annulée', disputed: 'Litige',
  };
  const statusColors: Record<string, string> = {
    pending: 'badge-yellow', accepted: 'badge-blue', in_progress: 'badge-blue',
    completed: 'badge-green', cancelled: 'badge-yellow', disputed: 'badge-yellow',
  };

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin" style={{ color: '#6b7280' }}>&larr; Administration</Link>
        </div>
        <h1 className="section-title">Réservations ({meta.total || 0})</h1>

        <div className="filters" style={{ marginBottom: '1.5rem' }}>
          <select className="form-input" style={{ width: 'auto' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="accepted">Acceptée</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>

        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : bookingsData.length === 0 ? (
          <div className="card"><div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Aucune réservation.</div></div>
        ) : (
          <>
            {bookingsData.map((b) => (
              <div key={b.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{b.gig?.title}</div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        Client: {b.client?.profile?.name} &middot;
                        Prestataire: {b.gig?.provider?.profile?.name}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                        {new Date(b.scheduledAt).toLocaleDateString('fr-MA')} &middot; {b.totalPrice} MAD &middot; {b.address}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className={`badge ${statusColors[b.status] || 'badge-yellow'}`}>
                        {statusLabels[b.status] || b.status}
                      </span>
                      {b.review && <span className="stars" title={`${b.review.rating}/5`}>{'★'.repeat(b.review.rating)}</span>}
                    </div>
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
