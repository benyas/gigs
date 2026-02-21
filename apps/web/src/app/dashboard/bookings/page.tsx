'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookings } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Acceptée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
  disputed: 'Litige',
};

export default function BookingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    loadBookings();
  }, [user, token, loading, router]);

  async function loadBookings() {
    try {
      const res = await bookings.list(token!);
      setData(res.data);
    } catch {}
    setPageLoading(false);
  }

  async function handleStatusChange(bookingId: string, status: string) {
    setActionLoading(bookingId);
    try {
      await bookings.updateStatus(bookingId, status, token!);
      await loadBookings();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
    setActionLoading(null);
  }

  if (loading || pageLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ color: '#6b7280' }}>&larr; Tableau de bord</Link>
        </div>
        <h1 className="section-title">Mes réservations</h1>

        {data.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Aucune réservation.
            </div>
          </div>
        ) : (
          data.map((booking) => {
            const isProvider = booking.gig?.providerId === user?.id;
            return (
              <div key={booking.id} className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <Link href={`/gig/${booking.gig?.slug}`} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {booking.gig?.title}
                      </Link>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        {isProvider ? (
                          <>Client : {booking.client?.profile?.name}</>
                        ) : (
                          <>Prestataire : {booking.gig?.provider?.profile?.name}</>
                        )}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        {new Date(booking.scheduledAt).toLocaleDateString('fr-MA', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <span className="price">{booking.totalPrice} MAD</span>
                      </div>
                      {booking.address && (
                        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          Adresse : {booking.address}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${
                        booking.status === 'completed' ? 'badge-green' :
                        booking.status === 'pending' ? 'badge-yellow' :
                        booking.status === 'cancelled' ? '' :
                        'badge-blue'
                      }`}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </span>

                      {isProvider && booking.status === 'pending' && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(booking.id, 'accepted')}
                            disabled={actionLoading === booking.id}
                          >
                            Accepter
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleStatusChange(booking.id, 'cancelled')}
                            disabled={actionLoading === booking.id}
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                      {isProvider && booking.status === 'accepted' && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(booking.id, 'in_progress')}
                            disabled={actionLoading === booking.id}
                          >
                            Commencer
                          </button>
                        </div>
                      )}
                      {isProvider && booking.status === 'in_progress' && (
                        <div style={{ marginTop: '0.75rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(booking.id, 'completed')}
                            disabled={actionLoading === booking.id}
                          >
                            Terminer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
