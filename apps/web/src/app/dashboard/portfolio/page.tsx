'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { portfolio } from '@/lib/api';

export default function PortfolioPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    if (user.role !== 'provider') { router.push('/dashboard'); return; }

    portfolio.list(user.id)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setFetching(false));
  }, [user, token, loading, router]);

  async function handleUpload() {
    if (!file || !title.trim() || !token) return;
    setUploading(true);
    setMessage('');
    try {
      await portfolio.create(file, title.trim(), description.trim(), token);
      setTitle('');
      setDescription('');
      setFile(null);
      setShowForm(false);
      // Refresh
      const updated = await portfolio.list(user!.id);
      setItems(updated);
      setMessage('Element ajoute avec succes');
    } catch (err: any) {
      setMessage(err.message || 'Erreur lors de l\'ajout');
    }
    setUploading(false);
  }

  async function handleDelete(id: string) {
    if (!token || !confirm('Supprimer cet element ?')) return;
    try {
      await portfolio.remove(id, token);
      setItems(items.filter((i) => i.id !== id));
    } catch {
      alert('Erreur lors de la suppression');
    }
  }

  if (loading || fetching) {
    return (
      <section className="section">
        <div className="container">
          <div className="skeleton" style={{ height: 28, width: 200, marginBottom: '1.5rem' }} />
          <div className="grid grid-3" style={{ gap: '1rem' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 220, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.25px' }}>
            Mon portfolio
          </h1>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {message && (
          <div style={{
            marginBottom: '1rem', padding: '0.75rem', borderRadius: 'var(--radius)',
            background: message.includes('succes') ? 'var(--green-50, #f0fdf4)' : 'var(--red-50, #fef2f2)',
            color: message.includes('succes') ? 'var(--green-700, #15803d)' : 'var(--red-700, #b91c1c)',
            fontSize: '0.875rem',
          }}>
            {message}
          </div>
        )}

        {/* Upload form */}
        {showForm && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Ajouter un element</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.375rem' }}>Titre</label>
                  <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Renovation cuisine" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.375rem' }}>Description</label>
                  <textarea className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details du projet..." rows={3} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.375rem' }}>Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="form-input" style={{ padding: '0.5rem' }} />
                </div>
                <button className="btn btn-primary" onClick={handleUpload} disabled={uploading || !file || !title.trim()}>
                  {uploading ? 'Envoi...' : 'Ajouter au portfolio'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio grid */}
        {items.length > 0 ? (
          <div className="grid grid-3" style={{ gap: '1rem' }}>
            {items.map((item: any) => (
              <div key={item.id} className="card" style={{ overflow: 'hidden' }}>
                {item.imageUrl && (
                  <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
                    <Image src={item.imageUrl} alt={item.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} loading="lazy" />
                  </div>
                )}
                <div className="card-body">
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>{item.title}</h3>
                  {item.description && (
                    <p style={{ fontSize: '0.825rem', color: 'var(--gray-500)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                      {item.description}
                    </p>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ color: 'var(--red-500, #ef4444)', borderColor: 'var(--red-200, #fecaca)' }}
                    onClick={() => handleDelete(item.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card">
            <div className="empty-state" style={{ padding: '3rem' }}>
              <div className="empty-state-title">Portfolio vide</div>
              <div className="empty-state-desc">
                Ajoutez des photos de vos realisations pour attirer plus de clients.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
