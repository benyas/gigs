'use client';

import { useState, useEffect, FormEvent } from 'react';
import { categories as categoriesApi, cities as citiesApi, gigs } from '@/lib/api';

export default function CreateGigPage() {
  const [cats, setCats] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    cityId: '',
    basePrice: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([categoriesApi.list(), citiesApi.list()])
      .then(([c, ci]) => {
        setCats(c);
        setCityList(ci);
      })
      .catch(() => {});
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous devez être connecté pour créer un service.');
      setLoading(false);
      return;
    }

    try {
      const gig = await gigs.create(
        { ...form, basePrice: Number(form.basePrice) },
        token,
      );
      setSuccess(`Service "${gig.title}" créé avec succès !`);
      setForm({ title: '', description: '', categoryId: '', cityId: '', basePrice: '' });
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 600 }}>
        <h1 className="section-title">Proposer un service</h1>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
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
                  maxLength={200}
                  placeholder="Ex: Réparation de fuites d'eau"
                />
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <select
                  className="form-input"
                  value={form.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  required
                >
                  <option value="">Choisir une catégorie</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
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
                  <option value="">Choisir une ville</option>
                  {cityList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
                  placeholder="200"
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
                  maxLength={5000}
                  rows={5}
                  placeholder="Décrivez votre service en détail..."
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Création...' : 'Publier le service'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
