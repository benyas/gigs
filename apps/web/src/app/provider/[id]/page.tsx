'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { profile as profileApi, messaging } from '@/lib/api';

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const providerId = params.id as string;

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    profileApi.provider(providerId)
      .then((data) => {
        setProvider(data);
        document.title = `${data.profile?.name || 'Prestataire'} | Gigs.ma`;
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [providerId]);

  async function handleContact() {
    if (!token || !contactMsg.trim()) return;
    setSending(true);
    try {
      const result = await messaging.start(providerId, contactMsg.trim(), token);
      router.push(`/dashboard/messages/${result.conversation.id}`);
    } catch {
      alert('Erreur lors de l\'envoi');
      setSending(false);
    }
  }

  if (loading) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;
  }

  if (!provider) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <h1 style={{ marginBottom: '1rem' }}>Prestataire non trouve</h1>
          <Link href="/browse" className="btn btn-primary">Parcourir les services</Link>
        </div>
      </section>
    );
  }

  const p = provider.profile;
  const initial = p?.name?.charAt(0)?.toUpperCase() || 'P';

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/browse" style={{ color: '#6b7280' }}>&larr; Retour</Link>
        </div>

        {/* Profile header */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669, #047857)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '2rem', fontWeight: 700, flexShrink: 0,
              }}>
                {initial}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                  {p?.name}
                  {p?.isVerified && (
                    <span style={{ color: 'var(--primary)', marginLeft: '0.5rem', fontSize: '1rem' }} title="Verifie">&#10003;</span>
                  )}
                </h1>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', color: '#6b7280', fontSize: '0.9rem' }}>
                  {p?.city && <span>{p.city.name}</span>}
                  <span>
                    <span className="stars">{'★'.repeat(Math.round(p?.ratingAvg || 0))}</span>
                    {' '}({p?.ratingCount || 0} avis)
                  </span>
                  <span>Membre depuis {new Date(provider.memberSince).toLocaleDateString('fr-MA', { month: 'long', year: 'numeric' })}</span>
                </div>
                {p?.bio && <p style={{ marginTop: '0.75rem', color: '#4b5563', lineHeight: 1.6 }}>{p.bio}</p>}
              </div>
              {user && user.role === 'client' && user.id !== providerId && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowContact(!showContact)}
                  style={{ flexShrink: 0 }}
                >
                  Contacter
                </button>
              )}
            </div>

            {showContact && (
              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  className="form-input"
                  placeholder="Votre message..."
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleContact}
                  disabled={sending || !contactMsg.trim()}
                >
                  {sending ? '...' : 'Envoyer'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        {provider.gigs.length > 0 && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
              Services ({provider.gigs.length})
            </h2>
            <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
              {provider.gigs.map((gig: any) => (
                <Link key={gig.id} href={`/gig/${gig.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ height: '100%' }}>
                    {gig.media?.[0] && (
                      <div style={{
                        height: 140, background: `url(${gig.media[0].url}) center/cover`,
                        borderRadius: '12px 12px 0 0',
                      }} />
                    )}
                    <div className="card-body">
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{gig.title}</div>
                      <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        {gig.category?.name} &middot; {gig.city?.name}
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '0.5rem' }}>
                        {gig.basePrice} MAD
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Reviews */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Avis ({provider.reviews.length})
        </h2>
        {provider.reviews.length > 0 ? (
          provider.reviews.map((review: any) => (
            <div key={review.id} className="card" style={{ marginBottom: '0.75rem' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    {review.client?.profile && (
                      <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                        {review.client.profile.name}
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {new Date(review.createdAt).toLocaleDateString('fr-MA')}
                  </span>
                </div>
                <p style={{ lineHeight: 1.6 }}>{review.comment}</p>
                {review.booking?.gig && (
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Service : {review.booking.gig.title}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Aucun avis pour le moment.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
