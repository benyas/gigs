'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { availability as availabilityApi } from '@/lib/api';

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function AvailabilityPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'provider') {
      router.push('/auth/login');
      return;
    }
    availabilityApi.get(token)
      .then((data) => setSlots(data))
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [user, token, loading, router]);

  function updateSlot(dayOfWeek: number, field: keyof Slot, value: string | boolean) {
    setSlots((prev) =>
      prev.map((s) => s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s),
    );
  }

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await availabilityApi.update(slots, token);
      setSlots(updated);
      setSuccess('Horaires mis a jour !');
    } catch (err: any) {
      setError(err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  if (loading || dataLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </section>
    );
  }

  // Sort slots Monday first (1,2,3,4,5,6,0)
  const sortedSlots = [...slots].sort((a, b) => {
    const order = (d: number) => d === 0 ? 7 : d;
    return order(a.dayOfWeek) - order(b.dayOfWeek);
  });

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 650 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="section-title" style={{ margin: 0 }}>Disponibilites</h1>
          <Link href="/dashboard" className="btn btn-outline btn-sm">&larr; Tableau de bord</Link>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <div className="card-body" style={{ padding: '1.5rem' }}>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Definissez vos heures de disponibilite pour chaque jour de la semaine.
              Les clients verront ces horaires sur votre profil.
            </p>

            {sortedSlots.map((slot) => (
              <div
                key={slot.dayOfWeek}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f3f4f6',
                  opacity: slot.isActive ? 1 : 0.5,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 140, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={slot.isActive}
                    onChange={(e) => updateSlot(slot.dayOfWeek, 'isActive', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontWeight: 500 }}>{DAY_NAMES[slot.dayOfWeek]}</span>
                </label>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: 120, padding: '0.5rem' }}
                  value={slot.startTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'startTime', e.target.value)}
                  disabled={!slot.isActive}
                />
                <span style={{ color: '#9ca3af' }}>-</span>
                <input
                  type="time"
                  className="form-input"
                  style={{ width: 120, padding: '0.5rem' }}
                  value={slot.endTime}
                  onChange={(e) => updateSlot(slot.dayOfWeek, 'endTime', e.target.value)}
                  disabled={!slot.isActive}
                />
              </div>
            ))}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1.5rem' }}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les horaires'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
