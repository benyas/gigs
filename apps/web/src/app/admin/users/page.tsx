'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { admin } from '@/lib/api';

export default function AdminUsersPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'admin') { router.push('/'); return; }
    fetchUsers();
  }, [user, token, loading, router, page, roleFilter]);

  function fetchUsers() {
    if (!token) return;
    setDataLoading(true);
    admin.users(token, page, roleFilter || undefined, search || undefined)
      .then((res) => { setUsers(res.data); setMeta(res.meta); })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }

  async function handleRoleChange(userId: string, role: string) {
    if (!token) return;
    await admin.updateUserRole(userId, role, token);
    fetchUsers();
  }

  async function handleVerify(userId: string, verified: boolean) {
    if (!token) return;
    await admin.verifyUser(userId, verified, token);
    fetchUsers();
  }

  if (loading) return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;

  return (
    <section className="section">
      <div className="container">
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin" style={{ color: '#6b7280' }}>&larr; Administration</Link>
        </div>
        <h1 className="section-title">Utilisateurs ({meta.total || 0})</h1>

        {/* Filters */}
        <div className="filters" style={{ marginBottom: '1.5rem' }}>
          <select className="form-input" style={{ width: 'auto' }} value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">Tous les rôles</option>
            <option value="client">Clients</option>
            <option value="provider">Prestataires</option>
            <option value="admin">Admins</option>
          </select>
          <input
            type="text"
            placeholder="Rechercher (nom, email, téléphone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            style={{ flex: 1, padding: '0.5rem 1rem', border: '2px solid var(--border)', borderRadius: '8px' }}
          />
          <button className="btn btn-primary btn-sm" onClick={() => { setPage(1); fetchUsers(); }}>Rechercher</button>
        </div>

        {dataLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>Chargement...</div>
        ) : (
          <>
            {users.map((u) => (
              <div key={u.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ minWidth: '200px' }}>
                    <div style={{ fontWeight: 600 }}>{u.profile?.name || 'Sans nom'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                      {u.email || 'Pas d\'email'} &middot; {u.phone}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {u._count?.gigs || 0} services &middot; {u._count?.bookingsAsClient || 0} réservations &middot;
                      Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-MA')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {u.profile?.isVerified && <span className="badge badge-green">Vérifié</span>}
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                    >
                      <option value="client">Client</option>
                      <option value="provider">Prestataire</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.8rem' }}
                      onClick={() => handleVerify(u.id, !u.profile?.isVerified)}
                    >
                      {u.profile?.isVerified ? 'Retirer vérif.' : 'Vérifier'}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {meta.totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={p === page ? 'active' : ''} style={{ cursor: 'pointer', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 1rem', background: p === page ? 'var(--primary)' : 'white', color: p === page ? 'white' : 'inherit' }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
