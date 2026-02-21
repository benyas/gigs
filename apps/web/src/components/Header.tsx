'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { messaging, notifications } from '@/lib/api';

export function Header() {
  const { user, token, logout } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';

  useEffect(() => {
    if (!user || !token) return;
    messaging.unread(token).then(setUnreadMessages).catch(() => {});
    notifications.unreadCount(token).then(setUnreadNotifs).catch(() => {});

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

  const initial = user?.profile?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo" onClick={() => setMenuOpen(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Gigs.ma
        </Link>

        {/* Mobile toggle */}
        <button
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          )}
        </button>

        <nav className={`nav-links${menuOpen ? ' open' : ''}`}>
          <Link href="/browse" onClick={() => setMenuOpen(false)}>Parcourir</Link>

          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMenuOpen(false)}
                  style={{ color: 'var(--red-500)', fontWeight: 600 }}>
                  Admin
                </Link>
              )}

              {isProvider && (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    Tableau de bord
                  </Link>
                  <Link href="/create-gig" className="btn btn-primary btn-sm"
                    onClick={() => setMenuOpen(false)}>
                    + Proposer
                  </Link>
                </>
              )}

              {isClient && (
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                  Mes reservations
                </Link>
              )}

              {/* Messages */}
              <Link href="/dashboard/messages" onClick={() => setMenuOpen(false)}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                Messages
                {unreadMessages > 0 && (
                  <span className="nav-badge">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>

              {/* Notifications bell */}
              <div style={{ position: 'relative' }}>
                <button onClick={toggleNotifs} className="notif-bell" aria-label="Notifications">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {unreadNotifs > 0 && (
                    <span className="nav-badge">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <h3>Notifications</h3>
                      {unreadNotifs > 0 && (
                        <button onClick={markAllRead} className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                          Tout marquer lu
                        </button>
                      )}
                    </div>
                    {notifList.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.85rem' }}>
                        Aucune notification
                      </div>
                    ) : (
                      notifList.slice(0, 10).map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || '#'}
                          onClick={() => setShowNotifs(false)}
                          className={`notif-item${!n.isRead ? ' unread' : ''}`}
                        >
                          <div className="notif-item-title">{n.title}</div>
                          <div className="notif-item-body">{n.body.slice(0, 80)}</div>
                          <div className="notif-item-time">
                            {new Date(n.createdAt).toLocaleDateString('fr-MA')}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User avatar & name */}
              <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="nav-avatar">{initial}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                  {user.profile?.name?.split(' ')[0] || 'Profil'}
                </span>
              </Link>

              <button onClick={logout} className="btn btn-outline btn-sm">
                Deconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-outline btn-sm"
                onClick={() => setMenuOpen(false)}>
                Connexion
              </Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm"
                onClick={() => setMenuOpen(false)}>
                Inscription
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
