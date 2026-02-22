'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { favorites } from '@/lib/api';

export function FavoriteButton({ gigId, size = 20 }: { gigId: string; size?: number }) {
  const { token } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    favorites.check(gigId, token)
      .then((res) => setFavorited(res.favorited))
      .catch(() => {});
  }, [gigId, token]);

  if (!token) return null;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const res = await favorites.toggle(gigId, token!);
      setFavorited(res.favorited);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{
        background: 'rgba(255,255,255,0.9)',
        border: 'none',
        borderRadius: '50%',
        width: size + 12,
        height: size + 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 150ms ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={favorited ? '#ef4444' : 'none'}
        stroke={favorited ? '#ef4444' : '#6b7280'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
