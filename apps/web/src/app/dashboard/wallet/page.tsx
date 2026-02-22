'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { payments } from '@/lib/api';

const TYPE_LABELS: Record<string, string> = {
  charge: 'Paiement recu',
  refund: 'Remboursement',
  payout: 'Virement',
  platform_fee: 'Commission',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  completed: 'Termine',
  failed: 'Echoue',
};

export default function WalletPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    loadData();
  }, [user, token, loading, router]);

  async function loadData() {
    try {
      const [w, t] = await Promise.all([
        payments.wallet(token!),
        payments.transactions(token!, page),
      ]);
      setWallet(w);
      setTransactions(t.data);
      setMeta(t.meta);
    } catch {}
    setPageLoading(false);
  }

  async function loadPage(p: number) {
    setPage(p);
    try {
      const t = await payments.transactions(token!, p);
      setTransactions(t.data);
      setMeta(t.meta);
    } catch {}
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
      <div className="container" style={{ maxWidth: 900 }}>
        <h1 className="section-title">Portefeuille</h1>

        {/* Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Solde disponible</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                {(wallet?.balance || 0).toFixed(2)} MAD
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>En attente (escrow)</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--warning)' }}>
                {(wallet?.pendingBalance || 0).toFixed(2)} MAD
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Total gagne</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                {(wallet?.totalEarned || 0).toFixed(2)} MAD
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Historique des transactions</h2>

        {transactions.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
              Aucune transaction
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {transactions.map((tx: any) => (
              <div key={tx.id} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {TYPE_LABELS[tx.type] || tx.type}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                      {tx.booking?.gig?.title || '—'} &middot; {new Date(tx.createdAt).toLocaleDateString('fr-MA')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: 700,
                      color: tx.type === 'charge' ? 'var(--success)' : tx.type === 'refund' ? 'var(--danger)' : 'var(--gray-700)',
                    }}>
                      {tx.type === 'payout' || tx.type === 'refund' ? '-' : '+'}{tx.amount.toFixed(2)} MAD
                    </div>
                    <div style={{ fontSize: '0.75rem' }}>
                      <span className={`badge badge-${tx.status === 'completed' ? 'green' : tx.status === 'failed' ? 'red' : 'yellow'}`}>
                        {STATUS_LABELS[tx.status] || tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            {Array.from({ length: meta.totalPages }, (_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${page === i + 1 ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => loadPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
