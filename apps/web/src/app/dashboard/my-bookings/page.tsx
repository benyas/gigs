'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookings as bookingsApi, reviews as reviewsApi, payments, disputes } from '@/lib/api';
import { ReviewForm } from '@/components/ReviewForm';

export default function MyBookingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  function loadBookings() {
    if (!token) return;
    bookingsApi.list(token)
      .then((res) => setMyBookings(res.data || []))
      .catch(() => {})
      .finally(() => setPageLoading(false));
  }

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    loadBookings();
  }, [user, token, loading, router]);

  async function handleCancel(bookingId: string) {
    if (!token) return;
    const reason = prompt('Raison de l\'annulation (optionnel) :');
    if (reason === null) return; // User pressed Cancel in prompt
    try {
      await bookingsApi.cancel(bookingId, reason, token);
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
  }

  async function handleReply(reviewId: string) {
    if (!token || !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      await reviewsApi.reply(reviewId, replyText.trim(), token);
      setReplyingId(null);
      setReplyText('');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setReplySubmitting(false);
    }
  }

  if (loading || pageLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </section>
    );
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
    disputed: 'Litige',
  };

  const statusBadge: Record<string, string> = {
    pending: 'badge-yellow',
    accepted: 'badge-blue',
    in_progress: 'badge-blue',
    completed: 'badge-green',
    cancelled: 'badge-yellow',
    disputed: 'badge-yellow',
  };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ color: '#6b7280' }}>&larr; Tableau de bord</Link>
        </div>
        <h1 className="section-title">Mes réservations ({myBookings.length})</h1>

        {myBookings.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Aucune réservation. <Link href="/browse">Parcourir les services</Link>
            </div>
          </div>
        ) : (
          myBookings.map((booking) => {
            const isClient = booking.clientId === user?.id;
            const canCancel = isClient && ['pending', 'accepted'].includes(booking.status);
            const canReview = isClient && booking.status === 'completed' && !booking.review;

            return (
              <div key={booking.id} className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <Link href={`/gig/${booking.gig?.slug}`} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                        {booking.gig?.title}
                      </Link>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="badge badge-green">{booking.gig?.category?.name}</span>
                        <span className="price" style={{ fontSize: '1rem' }}>{booking.totalPrice} MAD</span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                        {new Date(booking.scheduledAt).toLocaleDateString('fr-MA', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                      {booking.address && (
                        <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                          {booking.address}
                        </div>
                      )}
                      {!isClient && booking.client?.profile && (
                        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          Client: <strong>{booking.client.profile.name}</strong>
                        </div>
                      )}
                      {isClient && booking.gig?.provider?.profile && (
                        <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          Prestataire: <strong>{booking.gig.provider.profile.name}</strong>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span className={`badge ${statusBadge[booking.status] || 'badge-yellow'}`}>
                        {statusLabels[booking.status] || booking.status}
                      </span>
                      {isClient && booking.status === 'accepted' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={async () => {
                            try {
                              const res = await payments.initiate(booking.id, token!);
                              window.location.href = res.paymentUrl;
                            } catch (err: any) {
                              alert(err.message || 'Erreur de paiement');
                            }
                          }}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Payer maintenant
                        </button>
                      )}
                      {canCancel && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleCancel(booking.id)}
                          style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: '0.8rem' }}
                        >
                          Annuler
                        </button>
                      )}
                      {canReview && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setReviewingId(reviewingId === booking.id ? null : booking.id)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Laisser un avis
                        </button>
                      )}
                      {isClient && ['completed', 'in_progress'].includes(booking.status) && !booking.dispute && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={async () => {
                            const reason = prompt('Decrivez le probleme :');
                            if (!reason?.trim()) return;
                            try {
                              await disputes.create(booking.id, reason.trim(), token!);
                              alert('Litige ouvert. Consultez la page Litiges pour suivre.');
                              loadBookings();
                            } catch (err: any) {
                              alert(err.message || 'Erreur');
                            }
                          }}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Signaler un probleme
                        </button>
                      )}
                    </div>
                  </div>

                  {booking.status === 'cancelled' && booking.cancelReason && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px', fontSize: '0.85rem', color: '#991b1b' }}>
                      Raison de l&apos;annulation : {booking.cancelReason}
                    </div>
                  )}

                  {booking.review && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px' }}>
                      <span className="stars">{'★'.repeat(booking.review.rating)}{'☆'.repeat(5 - booking.review.rating)}</span>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{booking.review.comment}</p>

                      {booking.review.providerReply && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>Votre reponse</div>
                          <p style={{ fontSize: '0.85rem' }}>{booking.review.providerReply}</p>
                        </div>
                      )}

                      {!isClient && !booking.review.providerReply && replyingId !== booking.review.id && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                          onClick={() => { setReplyingId(booking.review.id); setReplyText(''); }}
                        >
                          Repondre a cet avis
                        </button>
                      )}

                      {replyingId === booking.review.id && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                          <input
                            className="form-input"
                            placeholder="Votre reponse..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleReply(booking.review.id)}
                            disabled={replySubmitting || !replyText.trim()}
                          >
                            {replySubmitting ? '...' : 'Envoyer'}
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setReplyingId(null)}
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {reviewingId === booking.id && token && (
                    <ReviewForm
                      bookingId={booking.id}
                      token={token}
                      onSubmitted={() => {
                        setReviewingId(null);
                        loadBookings();
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
