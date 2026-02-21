'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { bookings } from '@/lib/api';

interface BookingFormProps {
  gigId: string;
  gigTitle: string;
  basePrice: number;
}

export function BookingForm({ gigId, basePrice }: BookingFormProps) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [scheduledAt, setScheduledAt] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user || !token) {
    return (
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ margin: '0 auto 0.75rem', display: 'block' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <p style={{ marginBottom: '1rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Connectez-vous pour reserver ce service
          </p>
          <a href="/auth/login" className="btn btn-primary" style={{ width: '100%' }}>Se connecter</a>
        </div>
      </div>
    );
  }

  if (user.role === 'provider') {
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await bookings.create(
        {
          gigId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          address,
          notes: notes || undefined,
        },
        token!,
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la reservation');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card">
        <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 'var(--radius-full)',
            background: 'var(--primary-100)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 0.875rem',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Reservation envoyee !</p>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Le prestataire va confirmer votre demande.
          </p>
          <button className="btn btn-primary" style={{ width: '100%' }}
            onClick={() => router.push('/dashboard/my-bookings')}>
            Voir mes reservations
          </button>
        </div>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <div className="card">
      <div className="card-body" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1rem' }}>
          Reserver ce service
        </h3>
        <div style={{
          marginBottom: '1.25rem', padding: '0.875rem',
          background: 'var(--primary-50)', borderRadius: 'var(--radius)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Prix a partir de</span>
          <span className="price">{basePrice} MAD</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date et heure souhaitees</label>
            <input
              type="datetime-local"
              className="form-input"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={minDate}
              required
            />
          </div>
          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Votre adresse complete"
              required
              minLength={5}
            />
          </div>
          <div className="form-group">
            <label>Notes (optionnel)</label>
            <textarea
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instructions supplementaires..."
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Envoi...' : 'Confirmer la reservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
