'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '+212',
    password: '',
    role: 'client',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await auth.register(form);
      login(result.token, result.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Echec de l\'inscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Creer un compte</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>
            Rejoignez Gigs.ma en quelques secondes
          </p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.75rem' }}>
            {error && <div className="alert alert-error">{error}</div>}

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
                  placeholder="Mohammed Alami"
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  required
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label>Telephone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  required
                  pattern="\+212[0-9]{9}"
                  placeholder="+212600000000"
                  autoComplete="tel"
                />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="form-group">
                <label>Je suis</label>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  {[
                    { value: 'client', label: 'Client', desc: 'Je cherche des services' },
                    { value: 'provider', label: 'Prestataire', desc: 'Je propose des services' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      style={{
                        flex: 1,
                        padding: '0.875rem',
                        border: `1.5px solid ${form.role === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        background: form.role === opt.value ? 'var(--primary-50)' : 'transparent',
                        transition: 'all 150ms ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={opt.value}
                        checked={form.role === opt.value}
                        onChange={(e) => update('role', e.target.value)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.125rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{opt.desc}</div>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              Deja un compte ?{' '}
              <Link href="/auth/login" style={{ fontWeight: 600 }}>Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
