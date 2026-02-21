'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { messaging, notifications } from '@/lib/api';

export function Header() {
  const { user, token, loading, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';

  useEffect(() => {
    if (!user || !token) return;
    // Fetch unread counts
    messaging.unread(token).then(setUnreadMessages).catch(() => {});
    notifications.unreadCount(token).then(setUnreadNotifs).catch(() => {});

    // Poll every 30 seconds
    const interval = setInterval(() => {
      messaging.unread(token).then(setUnreadMessages).catch(() => {});
      notifications.unreadCount(token).then(setUnreadNotifs).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  async function toggleNotifs() {
    if (!token) return;
    if (!showNotifs) {
      notifications.list(token).then((res) => setNotifList(res.data)).catch(() => {});
    }
    setShowNotifs(!showNotifs);
  }

  async function markAllRead() {
    if (!token) return;
    await notifications.markAllRead(token).catch(() => {});
    setUnreadNotifs(0);
    setNotifList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo">
          Gigs.ma
        </Link>
        <nav className="nav-links">
          <Link href="/browse">Parcourir</Link>
          {!loading && (
            <>
              {user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin" style={{ color: '#ef4444', fontWeight: 600 }}>
                      Admin
                    </Link>
                  )}

                  {isProvider && (
                    <>
                      <Link href="/dashboard">Tableau de bord</Link>
                      <Link href="/create-gig" className="btn btn-primary btn-sm">
                        + Proposer
                      </Link>
                    </>
                  )}

                  {isClient && (
                    <Link href="/dashboard">Mes réservations</Link>
                  )}

                  {/* Messages */}
                  <Link href="/dashboard/messages" style={{ position: 'relative' }}>
                    Messages
                    {unreadMessages > 0 && (
                      <span style={{
                        position: 'absolute', top: -6, right: -10,
                        background: '#ef4444', color: '#fff', fontSize: '0.65rem',
                        borderRadius: '50%', width: 18, height: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700,
                      }}>
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Link>

                  {/* Notifications bell */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={toggleNotifs}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '1.1rem', padding: '0.25rem', position: 'relative',
                        color: 'inherit',
                      }}
                      aria-label="Notifications"
                    >
                      🔔
                      {unreadNotifs > 0 && (
                        <span style={{
                          position: 'absolute', top: -4, right: -8,
                          background: '#ef4444', color: '#fff', fontSize: '0.6rem',
                          borderRadius: '50%', width: 16, height: 16,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700,
                        }}>
                          {unreadNotifs > 9 ? '9+' : unreadNotifs}
                        </span>
                      )}
                    </button>

                    {showNotifs && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem',
                        width: 320, maxHeight: 400, overflowY: 'auto',
                        background: '#fff', border: '1px solid var(--border)',
                        borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        zIndex: 100,
                      }}>
                        <div style={{
                          padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                          {unreadNotifs > 0 && (
                            <button onClick={markAllRead} style={{
                              background: 'none', border: 'none', color: 'var(--primary)',
                              fontSize: '0.8rem', cursor: 'pointer',
                            }}>
                              Tout marquer lu
                            </button>
                          )}
                        </div>
                        {notifList.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                            Aucune notification
                          </div>
                        ) : (
                          notifList.slice(0, 10).map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || '#'}
                              onClick={() => setShowNotifs(false)}
                              style={{
                                display: 'block', padding: '0.75rem 1rem',
                                borderBottom: '1px solid #f3f4f6', textDecoration: 'none',
                                color: 'inherit', background: n.isRead ? '#fff' : '#f0fdf4',
                              }}
                            >
                              <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.85rem' }}>{n.title}</div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.15rem' }}>
                                {n.body.slice(0, 80)}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.15rem' }}>
                                {new Date(n.createdAt).toLocaleDateString('fr-MA')}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <Link href="/dashboard/settings">
                    {user.profile?.name?.split(' ')[0] || 'Profil'}
                  </Link>
                  <button
                    onClick={logout}
                    className="btn btn-outline btn-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    Deconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-outline btn-sm">
                    Connexion
                  </Link>
                  <Link href="/auth/register" className="btn btn-primary btn-sm">
                    Inscription
                  </Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
