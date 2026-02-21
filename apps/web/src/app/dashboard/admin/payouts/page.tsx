'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { payouts } from '@/lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Termine',
  failed: 'Echoue',
};

export default function AdminPayoutsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New payout form
  const [showForm, setShowForm] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    loadData();
  }, [user, token, loading, router]);

  async function loadData() {
    try {
      const [p, s] = await Promise.all([
        payouts.list(token!, page, filter || undefined),
        payouts.stats(token!),
      ]);
      setData(p.data);
      setMeta(p.meta);
      setStats(s);
    } catch {}
    setPageLoading(false);
  }

  async function handleComplete(id: string) {
    setActionLoading(id);
    try {
      await payouts.complete(id, token!);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
    setActionLoading(null);
  }

  async function handleCreatePayout() {
    if (!providerId || !amount) return;
    setActionLoading('create');
    try {
      await payouts.create(providerId, parseFloat(amount), token!);
      setShowForm(false);
      setProviderId('');
      setAmount('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    }
    setActionLoading(null);
  }

  if (loading || pageLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="section-title" style={{ marginBottom: 0 }}>Gestion des virements</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : 'Nouveau virement'}
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Virements en attente</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.pendingPayouts}</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Total verse</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{stats.totalPaidOut.toFixed(2)} MAD</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Soldes disponibles</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.totalAvailableBalance.toFixed(2)} MAD</div>
              </div>
            </div>
            <div className="card">
              <div className="card-body" style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>En escrow</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>{stats.totalEscrowBalance.toFixed(2)} MAD</div>
              </div>
            </div>
          </div>
        )}

        {/* New Payout Form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Nouveau virement</h3>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  placeholder="ID du prestataire"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <input
                  className="form-input"
                  placeholder="Montant (MAD)"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: 150 }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleCreatePayout}
                  disabled={actionLoading === 'create'}
                >
                  {actionLoading === 'create' ? '...' : 'Creer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ marginBottom: '1rem' }}>
          <select
            className="form-input"
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            style={{ width: 200 }}
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="processing">En cours</option>
            <option value="completed">Termines</option>
          </select>
        </div>

        {/* Payouts List */}
        {data.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
              Aucun virement
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data.map((payout: any) => (
              <div key={payout.id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {payout.provider?.profile?.name || payout.providerId}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                      {new Date(payout.createdAt).toLocaleDateString('fr-MA')}
                      {payout.processedAt && ` — Traite le ${new Date(payout.processedAt).toLocaleDateString('fr-MA')}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {payout.amount.toFixed(2)} MAD
                    </div>
                    <span className={`badge badge-${payout.status === 'completed' ? 'green' : payout.status === 'failed' ? 'red' : 'yellow'}`}>
                      {STATUS_LABELS[payout.status] || payout.status}
                    </span>
                    {payout.status !== 'completed' && payout.status !== 'failed' && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => handleComplete(payout.id)}
                        disabled={actionLoading === payout.id}
                      >
                        {actionLoading === payout.id ? '...' : 'Marquer termine'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
