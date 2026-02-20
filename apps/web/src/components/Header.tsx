'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo">
          Gigs.ma
        </Link>
        <nav className="nav-links">
          <Link href="/browse">Parcourir</Link>
          <Link href="/auth/login" className="btn btn-outline btn-sm">
            Connexion
          </Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm">
            Inscription
          </Link>
        </nav>
      </div>
    </header>
  );
}
