'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function RegisterPage() {
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
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Échec de l\'inscription');
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
              Créer un compte
            </h1>

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
                />
              </div>
              <div className="form-group">
                <label>Téléphone (+212...)</label>
                <input
                  type="tel"
                  className="form-input"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  required
                  pattern="\+212[0-9]{9}"
                  placeholder="+212600000000"
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
                />
              </div>
              <div className="form-group">
                <label>Je suis</label>
                <select
                  className="form-input"
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                >
                  <option value="client">Un client (je cherche des services)</option>
                  <option value="provider">Un prestataire (je propose des services)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Inscription...' : 'S\'inscrire'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280' }}>
              Déjà un compte ?{' '}
              <Link href="/auth/login">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
