'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';

export default function AdminDashboard() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'admin') { router.push('/'); return; }
    admin.stats(token).then(setStats).catch(() => {}).finally(() => setDataLoading(false));
  }, [user, token, loading, router]);

  if (loading || dataLoading) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;
  }

  if (!stats) return null;

  return (
    <section className="section">
      <div className="container">
        <h1 className="section-title">Administration</h1>

        {/* Stats Grid */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard label="Utilisateurs" value={stats.users.total} color="var(--primary)" />
          <StatCard label="Clients" value={stats.users.clients} color="#3b82f6" />
          <StatCard label="Prestataires" value={stats.users.providers} color="#8b5cf6" />
          <StatCard label="Services" value={stats.gigs.total} sub={`${stats.gigs.active} actifs`} color="#f59e0b" />
          <StatCard label="Réservations" value={stats.bookings.total} sub={`${stats.bookings.pending} en attente`} color="#ef4444" />
          <StatCard label="Avis" value={stats.reviews.total} color="#10b981" />
        </div>

        {/* Quick Links */}
        <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
          <Link href="/admin/users" className="card" style={{ textDecoration: 'none' }}>
            <div className="card-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontWeight: 600 }}>Gérer les utilisateurs</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{stats.users.total} utilisateurs</div>
            </div>
          </Link>
          <Link href="/admin/gigs" className="card" style={{ textDecoration: 'none' }}>
            <div className="card-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
              <div style={{ fontWeight: 600 }}>Gérer les services</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{stats.gigs.total} services</div>
            </div>
          </Link>
          <Link href="/admin/bookings" className="card" style={{ textDecoration: 'none' }}>
            <div className="card-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <div style={{ fontWeight: 600 }}>Réservations</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{stats.bookings.pending} en attente</div>
            </div>
          </Link>
          <Link href="/admin/categories" className="card" style={{ textDecoration: 'none' }}>
            <div className="card-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏷️</div>
              <div style={{ fontWeight: 600 }}>Catégories</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Ajouter / modifier</div>
            </div>
          </Link>
          <Link href="/admin/cities" className="card" style={{ textDecoration: 'none' }}>
            <div className="card-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏙️</div>
              <div style={{ fontWeight: 600 }}>Villes</div>
              <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Ajouter / modifier</div>
            </div>
          </Link>
        </div>

        {/* Recent Bookings */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Réservations récentes</h2>
        {stats.recentBookings?.map((b: any) => (
          <div key={b.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{b.gig?.title}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  {b.client?.profile?.name} &middot; {new Date(b.createdAt).toLocaleDateString('fr-MA')} &middot; {b.totalPrice} MAD
                </div>
              </div>
              <span className={`badge ${b.status === 'completed' ? 'badge-green' : b.status === 'pending' ? 'badge-yellow' : 'badge-blue'}`}>
                {b.status}
              </span>
            </div>
          </div>
        ))}
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
