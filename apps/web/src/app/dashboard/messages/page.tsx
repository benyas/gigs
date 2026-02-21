'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messaging } from '@/lib/api';

export default function MessagesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    messaging.conversations(token).then(setConversations).catch(() => {}).finally(() => setDataLoading(false));
  }, [user, token, loading, router]);

  if (loading || dataLoading) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;
  }

  function getOtherUser(conv: any) {
    return conv.clientId === user?.id ? conv.provider : conv.client;
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ color: '#6b7280' }}>&larr; Tableau de bord</Link>
        </div>
        <h1 className="section-title">Messages</h1>

        {conversations.length === 0 ? (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Aucune conversation pour le moment.
            </div>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = getOtherUser(conv);
            const lastMsg = conv.messages?.[0];
            const unread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== user?.id;

            return (
              <Link
                key={conv.id}
                href={`/dashboard/messages/${conv.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div className="card" style={{ marginBottom: '0.75rem', borderLeft: unread ? '3px solid var(--primary)' : undefined }}>
                  <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {other?.profile?.name || 'Utilisateur'}
                        {conv.booking?.gig && (
                          <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '0.5rem', fontSize: '0.85rem' }}>
                            — {conv.booking.gig.title}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <div style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                          {lastMsg.senderId === user?.id ? 'Vous: ' : ''}
                          {lastMsg.content.slice(0, 80)}{lastMsg.content.length > 80 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {lastMsg && (
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {new Date(lastMsg.createdAt).toLocaleDateString('fr-MA')}
                        </div>
                      )}
                      {unread && (
                        <span style={{
                          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                          background: 'var(--primary)', marginTop: '0.25rem',
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
