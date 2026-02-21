'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { gigs as gigsApi } from '@/lib/api';

export default function MyGigsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [myGigs, setMyGigs] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    gigsApi.mine(token).then(setMyGigs).catch(() => {}).finally(() => setPageLoading(false));
  }, [user, token, loading, router]);

  if (loading || pageLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ color: '#6b7280' }}>&larr; Tableau de bord</Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="section-title" style={{ margin: 0 }}>Mes services ({myGigs.length})</h1>
          <Link href="/create-gig" className="btn btn-primary btn-sm">+ Nouveau service</Link>
        </div>

        {myGigs.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Vous n'avez pas encore de services. <Link href="/create-gig">Créez votre premier service</Link>
            </div>
          </div>
        ) : (
          myGigs.map((gig) => (
            <div key={gig.id} className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Link href={`/gig/${gig.slug}`} style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      {gig.title}
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span className="badge badge-green">{gig.category?.name}</span>
                      <span className="badge badge-blue">{gig.city?.name}</span>
                      <span className="price" style={{ fontSize: '1rem' }}>{gig.basePrice} MAD</span>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {gig._count?.bookings || 0} réservation(s) &middot;
                      Créé le {new Date(gig.createdAt).toLocaleDateString('fr-MA')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span className={`badge ${gig.status === 'active' ? 'badge-green' : 'badge-yellow'}`}>
                      {gig.status}
                    </span>
                    <Link href={`/dashboard/gigs/${gig.id}/edit`} className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem' }}>
                      Modifier
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
