'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { profile } from '@/lib/api';

export default function AnalyticsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'provider') {
      router.push('/auth/login');
      return;
    }
    profile.stats(token)
      .then(setStats)
      .catch((err) => setError(err.message || 'Erreur de chargement'))
      .finally(() => setDataLoading(false));
  }, [user, token, loading, router]);

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

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <div className="alert alert-error">{error}</div>
          <Link href="/dashboard" className="btn btn-outline" style={{ marginTop: '1rem' }}>
            Retour au tableau de bord
          </Link>
        </div>
      </section>
    );
  }

  if (!stats) return null;

  const completionRate = stats.bookings.total > 0
    ? Math.round((stats.bookings.completed / stats.bookings.total) * 100)
    : 0;

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.125rem', letterSpacing: '-0.25px' }}>
              Statistiques
            </h1>
            <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>
              Suivez vos performances
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Retour
          </Link>
        </div>

        {/* Earnings */}
        <div className="card" style={{
          marginBottom: '1.75rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, var(--primary-900) 100%)',
          color: '#fff',
          border: 'none',
        }}>
          <div className="card-body" style={{
            padding: '2rem', display: 'flex', justifyContent: 'space-around',
            flexWrap: 'wrap', gap: '1.5rem',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: '0.375rem', fontWeight: 500 }}>Revenus totaux</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                {Number(stats.earnings.total).toLocaleString('fr-MA')}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, marginLeft: '0.25rem' }}>MAD</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: '0.375rem', fontWeight: 500 }}>Ce mois</div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                {Number(stats.earnings.thisMonth).toLocaleString('fr-MA')}
                <span style={{ fontSize: '0.9rem', fontWeight: 500, marginLeft: '0.25rem' }}>MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.gigs.total}</div>
            <div className="stat-label">Services</div>
            <div style={{ color: 'var(--gray-400)', fontSize: '0.7rem', marginTop: '0.125rem' }}>{stats.gigs.active} actifs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--yellow-500)' }}>{stats.bookings.total}</div>
            <div className="stat-label">Reservations</div>
            <div style={{ color: 'var(--gray-400)', fontSize: '0.7rem', marginTop: '0.125rem' }}>{stats.bookings.pending} en attente</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--primary-400)' }}>{stats.bookings.completed}</div>
            <div className="stat-label">Terminees</div>
            <div style={{ color: 'var(--gray-400)', fontSize: '0.7rem', marginTop: '0.125rem' }}>{completionRate}% taux</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: 'var(--blue-500)' }}>{stats.reviews.total}</div>
            <div className="stat-label">Avis</div>
            <div style={{ color: 'var(--gray-400)', fontSize: '0.7rem', marginTop: '0.125rem' }}>{stats.reviews.avgRating.toFixed(1)}/5 moyenne</div>
          </div>
        </div>

        {/* Recent bookings */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.875rem' }}>Reservations recentes</h2>
        {stats.recentBookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {stats.recentBookings.map((b: any) => (
              <div key={b.id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.gig?.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '0.125rem' }}>
                      {b.client?.profile?.name || 'Client'} &middot; {new Date(b.createdAt).toLocaleDateString('fr-MA')} &middot; {b.totalPrice} MAD
                    </div>
                  </div>
                  <span className={`badge ${
                    b.status === 'completed' ? 'badge-green' :
                    b.status === 'pending' ? 'badge-yellow' :
                    b.status === 'confirmed' ? 'badge-blue' :
                    'badge-red'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-desc">Aucune reservation pour le moment.</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
