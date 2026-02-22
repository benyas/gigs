'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { messaging } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BookingForm } from '@/components/BookingForm';
import { StarRating, AlertCircleIcon, VerifiedBadge } from '@/components/Icons';

export default function GigDetailClient({ gig }: { gig: any }) {
  const router = useRouter();
  const { user, token } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);

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

  const reviews = gig.bookings?.filter((b: any) => b.review).map((b: any) => b.review) || [];
  const hasImages = gig.media && gig.media.length > 0;
  const isOwnGig = user?.id === gig.provider?.id;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1000 }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/browse" style={{ color: 'var(--gray-400)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Retour aux services
          </Link>
        </div>

        <div className="gig-layout">
          {/* Main */}
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              {/* Gallery */}
              {hasImages ? (
                <div>
                  <div style={{
                    height: 320,
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    <Image
                      src={gig.media[activeImage].url}
                      alt={gig.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 640px"
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  </div>
                  {gig.media.length > 1 && (
                    <div style={{
                      display: 'flex', gap: '0.5rem', padding: '0.75rem 1rem',
                      overflowX: 'auto', background: 'var(--gray-50)',
                    }}>
                      {gig.media.map((m: any, i: number) => (
                        <Image
                          key={m.id}
                          src={m.url}
                          alt={`Photo ${i + 1}`}
                          width={64}
                          height={64}
                          onClick={() => setActiveImage(i)}
                          style={{
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            border: `2px solid ${i === activeImage ? 'var(--primary)' : 'transparent'}`,
                            opacity: i === activeImage ? 1 : 0.6,
                            transition: 'all 150ms ease',
                          }}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  height: 220,
                  background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', color: 'var(--primary)', fontWeight: 600,
                }}>
                  {gig.category?.name}
                </div>
              )}

              <div className="card-body" style={{ padding: '1.75rem' }}>
                {/* Tags */}
                <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.875rem' }}>
                  <span className="badge badge-green">{gig.category?.name}</span>
                  <span className="badge badge-blue">{gig.city?.name}</span>
                </div>

                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.25px', lineHeight: 1.25 }}>
                  {gig.title}
                </h1>

                {/* Provider info */}
                {gig.provider?.profile && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    marginBottom: '1.5rem', flexWrap: 'wrap',
                    padding: '0.875rem 1rem',
                    background: 'var(--gray-50)', borderRadius: 'var(--radius)',
                  }}>
                    <Link href={`/provider/${gig.provider.id}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div className="avatar">
                        {gig.provider.profile.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {gig.provider.profile.name}
                          {gig.provider.profile.isVerified && (
                            <VerifiedBadge size={16} />
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <StarRating rating={gig.provider.profile.ratingAvg} size={13} />
                          <span>({gig.provider.profile.ratingCount} avis)</span>
                        </div>
                      </div>
                    </Link>

                    {user && !isOwnGig && user.role === 'client' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setShowContact(!showContact)}
                        style={{ marginLeft: 'auto' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                        Contacter
                      </button>
                    )}
                  </div>
                )}

                {/* Contact form */}
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

                {/* Description */}
                <div style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--gray-700)' }}>
                  {gig.description}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="section-title" style={{ fontSize: '1.25rem' }}>
                  Avis ({reviews.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {reviews.map((review: any) => (
                    <div key={review.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                          <StarRating rating={review.rating} size={14} />
                          <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>
                            {new Date(review.createdAt).toLocaleDateString('fr-MA')}
                          </span>
                        </div>
                        <p style={{ lineHeight: 1.7, color: 'var(--gray-700)' }}>{review.comment}</p>
                        {review.providerReply && (
                          <div className="review-reply">
                            <div className="review-reply-label">Reponse du prestataire</div>
                            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--gray-700)' }}>
                              {review.providerReply}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
