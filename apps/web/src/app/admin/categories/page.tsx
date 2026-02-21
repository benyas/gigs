'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { admin, categories as categoriesApi } from '@/lib/api';

export default function AdminCategoriesPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token || user.role !== 'admin') { router.push('/'); return; }
    fetchCategories();
  }, [user, token, loading, router]);

  function fetchCategories() {
    categoriesApi.list().then(setCats).catch(() => {}).finally(() => setDataLoading(false));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    setSaving(true);
    try {
      const slug = form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      await admin.createCategory({ name: form.name, slug, icon: form.icon }, token);
      setForm({ name: '', icon: '' });
      setShowForm(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!token || !confirm(`Supprimer la catégorie "${name}" ?`)) return;
    try {
      await admin.deleteCategory(id, token);
      fetchCategories();
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
          <h1 className="section-title" style={{ margin: 0 }}>Catégories ({cats.length})</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body" style={{ padding: '1.5rem' }}>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ flex: 2 }} />
                <input className="form-input" placeholder="Icône (ex: wrench)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} required style={{ flex: 1 }} />
                <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Ajout...' : 'Ajouter'}</button>
              </form>
            </div>
          </div>
        )}

        {cats.map((cat) => (
          <div key={cat.id} className="card" style={{ marginBottom: '0.75rem' }}>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{cat.name}</span>
                <span style={{ color: '#6b7280', marginLeft: '0.75rem', fontSize: '0.85rem' }}>
                  {cat.slug} &middot; {cat.icon} &middot; {cat._count?.gigs || 0} services
                </span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem', color: '#ef4444', borderColor: '#fecaca' }}
                onClick={() => handleDelete(cat.id, cat.name)}
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
