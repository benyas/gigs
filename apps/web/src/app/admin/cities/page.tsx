'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { admin, cities as citiesApi } from '@/lib/api';

export default function AdminCitiesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [cityList, setCityList] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', region: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'admin') { router.push('/'); return; }
    fetchCities();
  }, [user, token, loading, router]);

  function fetchCities() {
    citiesApi.list().then(setCityList).catch(() => {}).finally(() => setDataLoading(false));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSaving(true);
    try {
      await admin.createCity({ name: form.name, region: form.region }, token);
      setForm({ name: '', region: '' });
      setShowForm(false);
      fetchCities();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!token || !confirm(`Supprimer la ville "${name}" ?`)) return;
    try {
      await admin.deleteCity(id, token);
      fetchCities();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading || dataLoading) return <section className="section"><div className="container" style={{ textAlign: 'center', padding: '4rem' }}>Chargement...</div></section>;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/admin" style={{ color: '#6b7280' }}>&larr; Administration</Link>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 className="section-title" style={{ margin: 0 }}>Villes ({cityList.length})</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Nom de la ville" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ flex: 2 }} />
                <input className="form-input" placeholder="Région" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} required style={{ flex: 2 }} />
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Ajout...' : 'Ajouter'}</button>
              </form>
            </div>
          </div>
        )}

        {cityList.map((city) => (
          <div key={city.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{city.name}</span>
                <span style={{ color: '#6b7280', marginLeft: '0.75rem', fontSize: '0.85rem' }}>{city.region}</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem', color: '#ef4444', borderColor: '#fecaca' }}
                onClick={() => handleDelete(city.id, city.name)}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
