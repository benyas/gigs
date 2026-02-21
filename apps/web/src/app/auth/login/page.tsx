'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await auth.login(email, password);
      login(result.token, result.user);
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else if (result.user.role === 'provider') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Echec de la connexion');
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
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Connexion</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>
            Connectez-vous a votre compte Gigs.ma
          </p>
        </div>

        <div className="card">
          <div className="card-body" style={{ padding: '1.75rem' }}>
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="votre@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
              Pas encore de compte ?{' '}
              <Link href="/auth/register" style={{ fontWeight: 600 }}>Creer un compte</Link>
            </p>

            {/* Demo accounts */}
            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '1.25rem', paddingTop: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'center', marginBottom: '0.625rem' }}>
                Comptes demo
              </p>
              <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'center' }}>
                {[
                  { label: 'Admin', email: 'admin@gigs.ma' },
                  { label: 'Prestataire', email: 'provider@gigs.ma' },
                  { label: 'Client', email: 'client@gigs.ma' },
                ].map((demo) => (
                  <button
                    key={demo.email}
                    type="button"
                    className="chip"
                    onClick={() => { setEmail(demo.email); setPassword('password123'); }}
                    style={{ fontSize: '0.725rem' }}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
