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

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }

    Promise.all([
      gigs.mine(token).catch(() => []),
      bookings.list(token).catch(() => ({ data: [] })),
    ]).then(([g, b]) => {
      setMyGigs(g);
      setMyBookings(b.data || []);
      setDataLoading(false);
    });
  }, [user, token, loading, router]);

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
        <h1 className="section-title">
          Bonjour, {user?.profile?.name || 'Utilisateur'}
        </h1>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{activeGigs}</div>
              <div style={{ color: '#6b7280' }}>Services actifs</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>{pendingBookings}</div>
              <div style={{ color: '#6b7280' }}>Réservations en attente</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>{myBookings.length}</div>
              <div style={{ color: '#6b7280' }}>Total réservations</div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                <span className="stars">{'★'.repeat(Math.round(user?.profile?.ratingAvg || 0))}</span>
              </div>
              <div style={{ color: '#6b7280' }}>{user?.profile?.ratingCount || 0} avis</div>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
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
                    <span className={`badge ${gig.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                      {gig.status}
                    </span>
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

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Réservations récentes</h2>
              <Link href="/dashboard/bookings" className="btn btn-outline btn-sm">Tout voir</Link>
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
                  Aucune réservation pour le moment.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
