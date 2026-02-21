'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const { user, loading, logout } = useAuth();

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
                  <Link href="/dashboard">Tableau de bord</Link>
                  {user.role === 'provider' && (
                    <Link href="/create-gig" className="btn btn-primary btn-sm">
                      + Proposer
                    </Link>
                  )}
                  <Link href="/dashboard/my-bookings">Réservations</Link>
                  <Link href="/dashboard/settings" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
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
