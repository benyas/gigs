'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { gigs, messaging } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BookingForm } from '@/components/BookingForm';

export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const slug = params.slug as string;

  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    gigs.getBySlug(slug)
      .then((data) => {
        setGig(data);
        document.title = `${data.title} | Gigs.ma`;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleContact() {
    if (!token || !gig || !contactMsg.trim()) return;
    setSending(true);
    try {
      const result = await messaging.start(gig.provider.id, contactMsg.trim(), token);
      router.push(`/dashboard/messages/${result.conversation.id}`);
    } catch {
      alert('Erreur lors de l\'envoi');
      setSending(false);
    }
  }

  if (loading) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;
  }

  if (!gig) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <h1 style={{ marginBottom: '1rem' }}>Service non trouve</h1>
          <Link href="/browse" className="btn btn-primary">Parcourir les services</Link>
        </div>
      </section>
    );
  }

  const reviews = gig.bookings?.filter((b: any) => b.review).map((b: any) => b.review) || [];
  const hasImages = gig.media && gig.media.length > 0;
  const isOwnGig = user?.id === gig.provider?.id;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1000 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/browse" style={{ color: '#6b7280' }}>&larr; Retour aux services</Link>
        </div>

        <div className="gig-layout">
          {/* Main content */}
          <div>
            <div className="card" style={{ marginBottom: '2rem' }}>
              {/* Image gallery */}
              {hasImages ? (
                <div>
                  <div style={{
                    height: 300,
                    background: `url(${gig.media[activeImage].url}) center/cover`,
                    borderRadius: '12px 12px 0 0',
                  }} />
                  {gig.media.length > 1 && (
                    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', overflowX: 'auto' }}>
                      {gig.media.map((m: any, i: number) => (
                        <img
                          key={m.id}
                          src={m.url}
                          alt={`Photo ${i + 1}`}
                          onClick={() => setActiveImage(i)}
                          style={{
                            width: 60, height: 60, objectFit: 'cover', borderRadius: 6,
                            cursor: 'pointer', border: i === activeImage ? '2px solid var(--primary)' : '2px solid transparent',
                            opacity: i === activeImage ? 1 : 0.6,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  height: 200,
                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', color: '#059669', fontWeight: 600,
                  borderRadius: '12px 12px 0 0',
                }}>
                  {gig.category?.name}
                </div>
              )}

              <div className="card-body" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span className="badge badge-green">{gig.category?.name}</span>
                  <span className="badge badge-blue">{gig.city?.name}</span>
                </div>

                <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{gig.title}</h1>

                {gig.provider?.profile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <Link
                      href={`/provider/${gig.provider.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                      }}>
                        {gig.provider.profile.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <strong>{gig.provider.profile.name}</strong>
                        {gig.provider.profile.isVerified && (
                          <span style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>&#10003;</span>
                        )}
                      </div>
                    </Link>
                    <span className="stars">
                      {'★'.repeat(Math.round(gig.provider.profile.ratingAvg))}
                      {'☆'.repeat(5 - Math.round(gig.provider.profile.ratingAvg))}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      ({gig.provider.profile.ratingCount} avis)
                    </span>

                    {/* Contact button */}
                    {user && !isOwnGig && user.role === 'client' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setShowContact(!showContact)}
                        style={{ marginLeft: 'auto' }}
                      >
                        Contacter
                      </button>
                    )}
                  </div>
                )}

                {showContact && (
                  <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                      className="form-input"
                      placeholder="Votre question au prestataire..."
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleContact}
                      disabled={sending || !contactMsg.trim()}
                    >
                      {sending ? '...' : 'Envoyer'}
                    </button>
                  </div>
                )}

                <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {gig.description}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="section-title">Avis ({reviews.length})</h2>
                {reviews.map((review: any) => (
                  <div key={review.id} className="card" style={{ marginBottom: '0.75rem' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                          {new Date(review.createdAt).toLocaleDateString('fr-MA')}
                        </span>
                      </div>
                      <p style={{ lineHeight: 1.6 }}>{review.comment}</p>
                      {review.providerReply && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, borderLeft: '3px solid var(--primary)' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                            Reponse du prestataire
                          </div>
                          <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{review.providerReply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '5rem' }}>
            <BookingForm gigId={gig.id} gigTitle={gig.title} basePrice={gig.basePrice} />
          </div>
        </div>
      </div>
    </section>
  );
}
