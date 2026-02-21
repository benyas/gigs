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
          Chargement...
        </div>
      </section>
    );
  }

  const pendingBookings = myBookings.filter((b) => b.status === 'pending').length;
  const activeGigs = myGigs.filter((g) => g.status === 'active').length;

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="section-title" style={{ margin: 0 }}>
            Bonjour, {user?.profile?.name || 'Utilisateur'}
          </h1>
          <Link href="/dashboard/settings" className="btn btn-outline btn-sm">
            Paramètres
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {isProvider && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{activeGigs}</div>
                <div style={{ color: '#6b7280' }}>Services actifs</div>
              </div>
            </div>
          )}
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{pendingBookings}</div>
              <div style={{ color: '#6b7280' }}>En attente</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{myBookings.length}</div>
              <div style={{ color: '#6b7280' }}>Total réservations</div>
            </div>
          </div>
          {isProvider && (
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                  <span className="stars">{'★'.repeat(Math.round(user?.profile?.ratingAvg || 0))}</span>
                </div>
                <div style={{ color: '#6b7280' }}>{user?.profile?.ratingCount || 0} avis</div>
              </div>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard/messages" className="btn btn-outline btn-sm">Messages</Link>
          <Link href="/dashboard/my-bookings" className="btn btn-outline btn-sm">Mes réservations</Link>
          {isProvider && <Link href="/dashboard/gigs" className="btn btn-outline btn-sm">Mes services</Link>}
          <Link href="/dashboard/settings" className="btn btn-outline btn-sm">Paramètres</Link>
        </div>

        <div className="grid grid-2">
          {/* Provider: my gigs */}
          {isProvider && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Mes services</h2>
                <Link href="/create-gig" className="btn btn-primary btn-sm">+ Nouveau</Link>
              </div>
              {myGigs.length > 0 ? (
                myGigs.slice(0, 5).map((gig) => (
                  <div key={gig.id} className="card" style={{ marginBottom: '0.75rem' }}>
                    <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Link href={`/gig/${gig.slug}`} style={{ fontWeight: 600 }}>{gig.title}</Link>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          {gig.category?.name} &middot; {gig.city?.name} &middot; {gig.basePrice} MAD
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${gig.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                          {gig.status}
                        </span>
                        <Link href={`/dashboard/gigs/${gig.id}/edit`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                          Modifier
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card">
                  <div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                    Aucun service. <Link href="/create-gig">Créez votre premier service</Link>
                  </div>
                </div>
              )}
              {myGigs.length > 5 && (
                <Link href="/dashboard/gigs" style={{ fontSize: '0.9rem' }}>Voir tous ({myGigs.length})</Link>
              )}
            </div>
          )}

          {/* Bookings */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Réservations récentes</h2>
              <Link href="/dashboard/my-bookings" className="btn btn-outline btn-sm">Tout voir</Link>
            </div>
            {myBookings.length > 0 ? (
              myBookings.slice(0, 5).map((booking) => (
                <div key={booking.id} className="card" style={{ marginBottom: '0.75rem' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{booking.gig?.title}</div>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                          {new Date(booking.scheduledAt).toLocaleDateString('fr-MA')} &middot; {booking.totalPrice} MAD
                        </div>
                      </div>
                      <span className={`badge ${
                        booking.status === 'completed' ? 'badge-green' :
                        booking.status === 'pending' ? 'badge-yellow' :
                        'badge-blue'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="card">
                <div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  {isProvider ? 'Aucune réservation pour le moment.' : (
                    <>Aucune réservation. <Link href="/browse">Parcourir les services</Link></>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
