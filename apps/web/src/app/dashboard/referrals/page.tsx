'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { referrals } from '@/lib/api';

export default function ReferralsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [myReferrals, setMyReferrals] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }

    Promise.all([
      referrals.getCode(token).catch(() => ({ code: '' })),
      referrals.mine(token).catch(() => null),
    ]).then(([codeRes, refs]) => {
      setCode(codeRes.code || '');
      setMyReferrals(refs);
      setFetching(false);
    });
  }, [user, token, loading, router]);

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading || fetching) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="skeleton" style={{ height: 28, width: 200, marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </section>
    );
  }

  const referralList = Array.isArray(myReferrals?.data) ? myReferrals.data : Array.isArray(myReferrals) ? myReferrals : [];

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.25px' }}>
          Parrainage
        </h1>

        {/* Referral code card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Votre code de parrainage
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1rem', lineHeight: 1.6 }}>
              Partagez ce code avec vos amis. Quand ils s&apos;inscrivent et effectuent leur premiere reservation, vous recevez une recompense.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div style={{
                flex: 1, padding: '0.75rem 1rem', background: 'var(--gray-50)',
                borderRadius: 'var(--radius)', fontWeight: 700, fontSize: '1.1rem',
                letterSpacing: '0.1em', textAlign: 'center', fontFamily: 'monospace',
              }}>
                {code || 'Chargement...'}
              </div>
              <button className="btn btn-primary btn-sm" onClick={copyCode} disabled={!code}>
                {copied ? 'Copie!' : 'Copier'}
              </button>
            </div>
          </div>
        </div>

        {/* Referrals list */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.875rem' }}>
          Vos filleuls ({referralList.length})
        </h2>

        {referralList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {referralList.map((ref: any, i: number) => (
              <div key={ref.id || i} className="card">
                <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {ref.referred?.profile?.name || ref.referredId?.slice(-6) || 'Utilisateur'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                      {new Date(ref.createdAt).toLocaleDateString('fr-MA')}
                    </div>
                  </div>
                  <span className={`badge ${ref.rewarded ? 'badge-green' : 'badge-yellow'}`}>
                    {ref.rewarded ? 'Recompense' : 'En attente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-desc">
                Aucun filleul pour le moment. Partagez votre code!
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
