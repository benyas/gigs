'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { gigs as gigsApi, categories as categoriesApi, cities as citiesApi } from '@/lib/api';

export default function EditGigPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const gigId = params.id as string;

  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '',
    categoryId: '',
    cityId: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }

    Promise.all([
      gigsApi.mine(token),
      categoriesApi.list(),
      citiesApi.list(),
    ]).then(([myGigs, cats, cits]) => {
      const gig = myGigs.find((g: any) => g.id === gigId);
      if (!gig) {
        router.push('/dashboard/gigs');
        return;
      }
      setForm({
        title: gig.title,
        description: gig.description || '',
        basePrice: String(gig.basePrice),
        categoryId: gig.categoryId || gig.category?.id || '',
        cityId: gig.cityId || gig.city?.id || '',
      });
      setCategories(cats);
      setCities(cits);
    }).catch(() => {}).finally(() => setPageLoading(false));
  }, [user, token, loading, router, gigId]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      await gigsApi.update(gigId, {
        title: form.title,
        description: form.description,
        basePrice: parseFloat(form.basePrice),
        categoryId: form.categoryId,
        cityId: form.cityId,
      }, token!);
      setSuccess('Service mis à jour !');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
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

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/dashboard/gigs" style={{ color: '#6b7280' }}>&larr; Mes services</Link>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Modifier le service</h1>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Titre du service</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  required
                  minLength={5}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-input"
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  required
                  minLength={20}
                  rows={6}
                />
              </div>
              <div className="form-group">
                <label>Prix de base (MAD)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.basePrice}
                  onChange={(e) => update('basePrice', e.target.value)}
                  required
                  min={1}
                  max={100000}
                />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label>Catégorie</label>
                  <select
                    className="form-input"
                    value={form.categoryId}
                    onChange={(e) => update('categoryId', e.target.value)}
                    required
                  >
                    <option value="">Choisir</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Ville</label>
                  <select
                    className="form-input"
                    value={form.cityId}
                    onChange={(e) => update('cityId', e.target.value)}
                    required
                  >
                    <option value="">Choisir</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.5rem' }}
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
