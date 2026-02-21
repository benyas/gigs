'use client';

import { useState, FormEvent } from 'react';
import { reviews } from '@/lib/api';

interface ReviewFormProps {
  bookingId: string;
  token: string;
  onSubmitted: () => void;
}

export function ReviewForm({ bookingId, token, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await reviews.create({ bookingId, rating, comment }, token);
      onSubmitted();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'avis');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-group">
        <label>Note</label>
        <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.5rem', cursor: 'pointer' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setRating(star)}
              style={{ color: star <= rating ? '#f59e0b' : '#d1d5db' }}
            >
              ★
            </span>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label>Votre avis</label>
        <textarea
          className="form-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Décrivez votre expérience (min. 10 caractères)"
          required
          minLength={10}
          rows={3}
        />
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
        {loading ? 'Envoi...' : 'Publier l\'avis'}
      </button>
    </form>
  );
}
