'use client';

import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { categories as categoriesApi, cities as citiesApi, gigs } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function CreateGigPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cats, setCats] = useState<any[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    cityId: '',
    basePrice: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'uploading' | 'done'>('form');
  const [loading, setLoading] = useState(false);
  const [createdGig, setCreatedGig] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || !token || user.role !== 'provider')) {
      router.push('/auth/login');
    }
  }, [user, token, authLoading, router]);

  useEffect(() => {
    Promise.all([categoriesApi.list(), citiesApi.list()])
      .then(([c, ci]) => { setCats(c); setCityList(ci); })
      .catch(() => {});
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    const total = [...files, ...selected].slice(0, 10);
    setFiles(total);
    // Generate previews
    const urls = total.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setLoading(true);

    try {
      const gig = await gigs.create(
        { ...form, basePrice: Number(form.basePrice) },
        token,
      );
      setCreatedGig(gig);

      // Upload images if any
      if (files.length > 0) {
        setStep('uploading');
        await gigs.uploadMedia(gig.id, files, token);
      }

      setStep('done');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la creation');
      setStep('form');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done' && createdGig) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
          <div className="card">
            <div className="card-body" style={{ padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>&#10003;</div>
              <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Service cree !</h1>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                &quot;{createdGig.title}&quot; est maintenant visible par les clients.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => router.push(`/gig/${createdGig.slug}`)}>
                  Voir le service
                </button>
                <button className="btn btn-outline" onClick={() => {
                  setForm({ title: '', description: '', categoryId: '', cityId: '', basePrice: '' });
                  setFiles([]); setPreviews([]); setCreatedGig(null); setStep('form');
                }}>
                  Creer un autre
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 600 }}>
        <h1 className="section-title">Proposer un service</h1>

        <div className="card">
          <div className="card-body" style={{ padding: '2rem' }}>
            {error && <div className="alert alert-error">{error}</div>}

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
                  placeholder="Ex: Reparation de fuites d'eau"
                />
              </div>

              <div className="form-group">
                <label>Categorie</label>
                <select
                  className="form-input"
                  value={form.categoryId}
                  onChange={(e) => update('categoryId', e.target.value)}
                  required
                >
                  <option value="">Choisir une categorie</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Ville</label>
                  <select
                    className="form-input"
                    value={form.cityId}
                    onChange={(e) => update('cityId', e.target.value)}
                    required
                  >
                    <option value="">Choisir</option>
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
                  placeholder="Decrivez votre service en detail..."
                />
              </div>

              {/* Image upload */}
              <div className="form-group">
                <label>Photos (jusqu&apos;a 10)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 8, padding: '2rem',
                    textAlign: 'center', cursor: 'pointer',
                    background: '#f9fafb',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#9ca3af' }}>+</div>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Cliquez pour ajouter des photos (JPEG, PNG, WebP, max 5 Mo)
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFiles}
                  style={{ display: 'none' }}
                />

                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {previews.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt={`Photo ${i + 1}`}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 20, height: 20, borderRadius: '50%',
                            background: '#ef4444', color: '#fff', border: 'none',
                            fontSize: '0.7rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {step === 'uploading' ? 'Upload des photos...' : loading ? 'Creation...' : 'Publier le service'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
