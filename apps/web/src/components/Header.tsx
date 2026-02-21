'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const { user, loading, logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isProvider = user?.role === 'provider';
  const isClient = user?.role === 'client';

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
                  {/* Admin nav */}
                  {isAdmin && (
                    <Link href="/admin" style={{ color: '#ef4444', fontWeight: 600 }}>
                      Admin
                    </Link>
                  )}

                  {/* Provider nav */}
                  {isProvider && (
                    <>
                      <Link href="/dashboard">Tableau de bord</Link>
                      <Link href="/create-gig" className="btn btn-primary btn-sm">
                        + Proposer
                      </Link>
                    </>
                  )}

                  {/* Client nav */}
                  {isClient && (
                    <Link href="/dashboard">Mes réservations</Link>
                  )}

                  {/* Common nav for all logged-in users */}
                  <Link href="/dashboard/settings">
                    {user.profile?.name?.split(' ')[0] || 'Profil'}
                  </Link>
                  <button
                    onClick={logout}
                    className="btn btn-outline btn-sm"
                    style={{ cursor: 'pointer' }}
                  >
                    Déconnexion
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
