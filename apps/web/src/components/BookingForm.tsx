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

export function BookingForm({ gigId, gigTitle, basePrice }: BookingFormProps) {
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
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
            Connectez-vous pour réserver ce service
          </p>
          <a href="/auth/login" className="btn btn-primary">Se connecter</a>
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
      setError(err.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
          <div className="alert alert-success">
            Réservation envoyée ! Le prestataire va la confirmer.
          </div>
          <button
            className="btn btn-primary"
            onClick={() => router.push('/dashboard/bookings')}
          >
            Voir mes réservations
          </button>
        </div>
      </div>
    );
  }

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div className="card-body" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Réserver ce service
        </h3>
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '8px' }}>
          <span className="price">{basePrice} MAD</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date et heure souhaitées</label>
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
              placeholder="Votre adresse complète"
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
              placeholder="Instructions supplémentaires..."
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Envoi...' : 'Confirmer la réservation'}
          </button>
        </form>
      </div>
    </div>
  );
}
