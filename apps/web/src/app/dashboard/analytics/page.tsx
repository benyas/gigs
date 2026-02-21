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
          Chargement...
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 className="section-title" style={{ margin: 0 }}>Statistiques</h1>
          <Link href="/dashboard" className="btn btn-outline btn-sm">&larr; Tableau de bord</Link>
        </div>

        {/* Earnings highlight */}
        <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff' }}>
          <div className="card-body" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>Revenus totaux</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                {Number(stats.earnings.total).toLocaleString('fr-MA')} <span style={{ fontSize: '1rem' }}>MAD</span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.25rem' }}>Ce mois</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>
                {Number(stats.earnings.thisMonth).toLocaleString('fr-MA')} <span style={{ fontSize: '1rem' }}>MAD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Services" value={stats.gigs.total} sub={`${stats.gigs.active} actifs`} color="var(--primary)" />
          <StatCard label="Reservations" value={stats.bookings.total} sub={`${stats.bookings.pending} en attente`} color="#f59e0b" />
          <StatCard label="Terminees" value={stats.bookings.completed} sub={`${completionRate}% taux`} color="#10b981" />
          <StatCard label="Avis" value={stats.reviews.total} sub={`${stats.reviews.avgRating.toFixed(1)}/5 moyenne`} color="#8b5cf6" />
        </div>

        {/* Recent bookings */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Reservations recentes</h2>
        {stats.recentBookings.length > 0 ? (
          stats.recentBookings.map((b: any) => (
            <div key={b.id} className="card" style={{ marginBottom: '0.75rem' }}>
              <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{b.gig?.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
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
          ))
        ) : (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Aucune reservation pour le moment.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="card">
      <div className="card-body" style={{ textAlign: 'center', padding: '1.25rem' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color }}>{value}</div>
        <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{label}</div>
        {sub && <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{sub}</div>}
      </div>
    </div>
  );
}
