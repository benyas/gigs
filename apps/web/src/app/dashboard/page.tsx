'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { gigs, bookings } from '@/lib/api';

export default function DashboardPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const isProvider = user?.role === 'provider';

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }

    const promises: Promise<any>[] = [
      bookings.list(token).catch(() => ({ data: [] })),
    ];
    if (isProvider) {
      promises.push(gigs.mine(token).catch(() => []));
    }

    Promise.all(promises).then(([b, g]) => {
      setMyBookings(b.data || []);
      if (g) setMyGigs(g);
      setDataLoading(false);
    });
  }, [user, token, loading, router, isProvider]);

  if (loading || dataLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="skeleton" style={{ width: 200, height: 24, margin: '0 auto 1rem' }} />
          <div className="skeleton" style={{ width: 300, height: 16, margin: '0 auto' }} />
        </div>
      </section>
    );
  }

  const pendingBookings = myBookings.filter((b) => b.status === 'pending').length;
  const activeGigs = myGigs.filter((g) => g.status === 'active').length;

  return (
    <section className="section">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem', letterSpacing: '-0.25px' }}>
              Bonjour, {user?.profile?.name?.split(' ')[0] || 'Utilisateur'}
            </h1>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
              Bienvenue sur votre tableau de bord
            </p>
          </div>
          <Link href="/dashboard/settings" className="btn btn-outline btn-sm">
            Parametres
          </Link>
        </div>

        {/* Stats */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
          {isProvider && (
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--primary)' }}>{activeGigs}</div>
              <div className="stat-label">Services actifs</div>
            </div>
          )}
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow-500)' }}>{pendingBookings}</div>
            <div className="stat-label">En attente</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{myBookings.length}</div>
            <div className="stat-label">Total reservations</div>
          </div>
          {isProvider && (
            <div className="stat-card">
              <div className="stat-value">
                <span className="stars">{'★'.repeat(Math.round(user?.profile?.ratingAvg || 0))}</span>
              </div>
              <div className="stat-label">{user?.profile?.ratingCount || 0} avis</div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/messages" className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Messages
          </Link>
          <Link href="/dashboard/my-bookings" className="btn btn-outline btn-sm">Mes reservations</Link>
          <Link href="/dashboard/favorites" className="btn btn-outline btn-sm">Favoris</Link>
          {isProvider && <Link href="/dashboard/gigs" className="btn btn-outline btn-sm">Mes services</Link>}
          {isProvider && <Link href="/dashboard/analytics" className="btn btn-outline btn-sm">Statistiques</Link>}
          {isProvider && <Link href="/dashboard/availability" className="btn btn-outline btn-sm">Disponibilites</Link>}
          {isProvider && <Link href="/dashboard/portfolio" className="btn btn-outline btn-sm">Portfolio</Link>}
          {isProvider && <Link href="/dashboard/verification" className="btn btn-outline btn-sm">Verification</Link>}
          <Link href="/dashboard/referrals" className="btn btn-outline btn-sm">Parrainage</Link>
          <Link href="/dashboard/settings" className="btn btn-outline btn-sm">Parametres</Link>
        </div>

        {/* Content grid */}
        <div className="grid grid-2">
          {/* Provider: my gigs */}
          {isProvider && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Mes services</h2>
                <Link href="/create-gig" className="btn btn-primary btn-sm">+ Nouveau</Link>
              </div>
              {myGigs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {myGigs.slice(0, 5).map((gig) => (
                    <div key={gig.id} className="card">
                      <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/gig/${gig.slug}`} style={{ fontWeight: 600, fontSize: '0.9rem' }}>{gig.title}</Link>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                            {gig.category?.name} &middot; {gig.city?.name} &middot; {gig.basePrice} MAD
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                          <span className={`badge ${gig.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                            {gig.status}
                          </span>
                          <Link href={`/dashboard/gigs/${gig.id}/edit`} className="btn btn-outline btn-sm">
                            Modifier
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card">
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <div className="empty-state-desc">
                      Aucun service. <Link href="/create-gig">Creez votre premier service</Link>
                    </div>
                  </div>
                </div>
              )}
              {myGigs.length > 5 && (
                <Link href="/dashboard/gigs" style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'inline-block' }}>
                  Voir tous ({myGigs.length})
                </Link>
              )}
            </div>
          )}

          {/* Bookings */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Reservations recentes</h2>
              <Link href="/dashboard/my-bookings" className="btn btn-outline btn-sm">Tout voir</Link>
            </div>
            {myBookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {myBookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="card">
                    <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{booking.gig?.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                          {new Date(booking.scheduledAt).toLocaleDateString('fr-MA')} &middot; {booking.totalPrice} MAD
                        </div>
                      </div>
                      <span className={`badge ${
                        booking.status === 'completed' ? 'badge-green' :
                        booking.status === 'pending' ? 'badge-yellow' :
                        booking.status === 'cancelled' ? 'badge-red' :
                        'badge-blue'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-state-desc">
                    {isProvider ? 'Aucune reservation pour le moment.' : (
                      <>Aucune reservation. <Link href="/browse">Parcourir les services</Link></>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
