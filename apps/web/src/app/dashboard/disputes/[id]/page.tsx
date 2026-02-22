'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { disputes } from '@/lib/api';

export default function DisputeDetailPage({ params }: { params: { id: string } }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [dispute, setDispute] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }

    disputes.get(params.id, token)
      .then(setDispute)
      .catch(() => router.push('/dashboard/disputes'))
      .finally(() => setFetching(false));
  }, [user, token, loading, router, params.id]);

  async function handleSend() {
    if (!newMessage.trim() || !token || sending) return;
    setSending(true);
    try {
      await disputes.addMessage(params.id, newMessage.trim(), token);
      setNewMessage('');
      // Refresh dispute data
      const updated = await disputes.get(params.id, token);
      setDispute(updated);
    } catch {
      alert('Erreur lors de l\'envoi du message');
    }
    setSending(false);
  }

  if (loading || fetching) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="skeleton" style={{ height: 28, width: 250, marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </section>
    );
  }

  if (!dispute) return null;

  const isResolved = dispute.status === 'resolved' || dispute.status === 'closed';

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        {/* Header */}
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => router.push('/dashboard/disputes')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--gray-400)', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Retour aux litiges
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.25px' }}>
            Litige #{dispute.id.slice(-6)}
          </h1>
          <span className={`badge ${dispute.status === 'resolved' ? 'badge-green' : dispute.status === 'open' ? 'badge-yellow' : 'badge-red'}`}>
            {dispute.status === 'resolved' ? 'Resolu' : dispute.status === 'open' ? 'Ouvert' : 'Ferme'}
          </span>
        </div>

        {/* Dispute info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-body">
            <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '0.75rem' }}>
              Ouvert le {new Date(dispute.createdAt).toLocaleDateString('fr-MA')}
            </div>
            <div style={{ lineHeight: 1.7, color: 'var(--gray-700)' }}>
              {dispute.reason}
            </div>
            {dispute.resolution && (
              <div style={{
                marginTop: '1rem', padding: '0.75rem', borderRadius: 'var(--radius)',
                background: 'var(--green-50, #f0fdf4)', fontSize: '0.875rem',
              }}>
                <strong>Resolution:</strong> {dispute.resolution}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.875rem' }}>
          Messages ({dispute.messages?.length || 0})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.5rem' }}>
          {(dispute.messages || []).map((msg: any) => (
            <div key={msg.id} className="card">
              <div className="card-body" style={{ padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600, color: msg.userId === user?.id ? 'var(--primary)' : 'var(--gray-700)' }}>
                    {msg.userId === user?.id ? 'Vous' : 'Support'}
                  </span>
                  <span style={{ color: 'var(--gray-400)' }}>
                    {new Date(msg.createdAt).toLocaleString('fr-MA')}
                  </span>
                </div>
                <p style={{ lineHeight: 1.6, color: 'var(--gray-700)', fontSize: '0.9rem' }}>{msg.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply form */}
        {!isResolved && (
          <div className="card">
            <div className="card-body">
              <textarea
                className="form-input"
                placeholder="Ajouter un message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                style={{ marginBottom: '0.75rem', resize: 'vertical' }}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
