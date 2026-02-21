'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { messaging } from '@/lib/api';

export default function ConversationPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [messages, setMessages] = useState<any[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    fetchMessages();

    // Poll for new messages every 5 seconds
    pollRef.current = setInterval(fetchMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, token, loading, router, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function fetchMessages() {
    if (!token) return;
    messaging.messages(conversationId, token)
      .then((res) => {
        setMessages(res.data);
        setConversation(res.conversation);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!token || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      const msg = await messaging.send(conversationId, newMessage.trim(), token);
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch {
      alert('Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  }

  if (loading || dataLoading) {
    return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;
  }

  function getOtherUser() {
    if (!conversation) return null;
    return conversation.clientId === user?.id
      ? { role: 'Prestataire', id: conversation.providerId }
      : { role: 'Client', id: conversation.clientId };
  }

  const other = getOtherUser();

  return (
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard/messages" style={{ color: '#6b7280' }}>&larr; Messages</Link>
        </div>

        {/* Messages container */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{
            height: '60vh', overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                Commencez la conversation...
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                    }}
                  >
                    <div style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: isMine ? 'var(--primary)' : '#f3f4f6',
                      color: isMine ? '#fff' : '#111',
                      fontSize: '0.95rem',
                      lineHeight: 1.5,
                    }}>
                      {msg.content}
                    </div>
                    <div style={{
                      fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem',
                      textAlign: isMine ? 'right' : 'left',
                    }}>
                      {new Date(msg.createdAt).toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', paddingBottom: '1rem' }}>
          <input
            className="form-input"
            placeholder="Votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ flex: 1 }}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? '...' : 'Envoyer'}
          </button>
        </form>
      </div>
    </section>
  );
}
