'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { profile as profileApi, cities as citiesApi } from '@/lib/api';

export default function SettingsPage() {
  const { user, token, loading, login } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: '', bio: '', phone: '', cityId: '' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }

    Promise.all([
      profileApi.get(token),
      citiesApi.list(),
    ]).then(([profileData, cityList]) => {
      setForm({
        name: profileData.profile?.name || '',
        bio: profileData.profile?.bio || '',
        phone: profileData.phone || '',
        cityId: profileData.profile?.cityId || '',
      });
      setAvatarUrl(profileData.profile?.avatarUrl || null);
      setCities(cityList);
    }).catch(() => {}).finally(() => setPageLoading(false));
  }, [user, token, loading, router]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setAvatarUploading(true);
    setError('');
    try {
      const updated = await profileApi.uploadAvatar(file, token);
      setAvatarUrl(updated.profile?.avatarUrl || null);
      login(token, updated);
      setSuccess('Photo de profil mise a jour !');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const data: Record<string, string> = {};
      if (form.name) data.name = form.name;
      if (form.bio) data.bio = form.bio;
      if (form.phone) data.phone = form.phone;
      if (form.cityId) data.cityId = form.cityId;

      const updated = await profileApi.update(data, token!);
      login(token!, updated);
      setSuccess('Profil mis a jour !');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise a jour');
    } finally {
      setSaving(false);
    }
  }

  if (loading || pageLoading) {
    return (
      <section className="section">
        <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div>
      </section>
    );
  }

  const initials = form.name ? form.name.charAt(0).toUpperCase() : '?';

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 600 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard" style={{ color: '#6b7280' }}>&larr; Tableau de bord</Link>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Parametres du profil</h1>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Avatar upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
                  overflow: 'hidden', flexShrink: 0, position: 'relative',
                  background: avatarUrl ? `url(${avatarUrl}) center/cover` : 'linear-gradient(135deg, #059669, #047857)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '2rem', fontWeight: 700,
                  border: '3px solid var(--border)',
                }}
              >
                {!avatarUrl && initials}
                {avatarUploading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '0.75rem',
                  }}>
                    ...
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? 'Upload...' : 'Changer la photo'}
                </button>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  JPEG, PNG ou WebP, max 5 Mo
                </p>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom complet</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  required
                  minLength={2}
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  className="form-input"
                  value={form.bio}
                  onChange={(e) => update('bio', e.target.value)}
                  placeholder="Decrivez-vous en quelques mots..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Telephone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  pattern="\+212[0-9]{9}"
                  placeholder="+212600000000"
                />
              </div>
              <div className="form-group">
                <label>Ville</label>
                <select
                  className="form-input"
                  value={form.cityId}
                  onChange={(e) => update('cityId', e.target.value)}
                >
                  <option value="">Selectionner une ville</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span className="badge badge-blue">{user?.role === 'provider' ? 'Prestataire' : 'Client'}</span>
                <span className="badge">{user?.email}</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1.5rem' }}
                disabled={saving}
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
