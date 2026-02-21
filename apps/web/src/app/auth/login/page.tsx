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
      // Redirect based on role
      if (result.user.role === 'admin') {
        router.push('/admin');
      } else if (result.user.role === 'provider') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 440 }}>
        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Connexion
            </h1>

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
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
              Pas encore de compte ?{' '}
              <Link href="/auth/register">Creer un compte</Link>
            </p>

            {/* Demo accounts */}
            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', marginBottom: '0.75rem' }}>
                Comptes demo :
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}
                  onClick={() => { setEmail('admin@gigs.ma'); setPassword('password123'); }}>
                  Admin
                </button>
                <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}
                  onClick={() => { setEmail('provider@gigs.ma'); setPassword('password123'); }}>
                  Prestataire
                </button>
                <button type="button" className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}
                  onClick={() => { setEmail('client@gigs.ma'); setPassword('password123'); }}>
                  Client
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
