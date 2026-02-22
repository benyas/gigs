'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { verification } from '@/lib/api';

const DOC_TYPES = [
  { value: 'cin', label: 'Carte d\'identite nationale (CIN)' },
  { value: 'passport', label: 'Passeport' },
  { value: 'business_license', label: 'Registre de commerce / Patente' },
];

export default function VerificationPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('cin');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || !token) { router.push('/auth/login'); return; }
    if (user.role !== 'provider') { router.push('/dashboard'); return; }

    verification.mine(token)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setFetching(false));
  }, [user, token, loading, router]);

  async function handleUpload() {
    if (!selectedFile || !token) return;
    setUploading(true);
    setMessage('');
    try {
      await verification.upload(selectedFile, selectedType, token);
      setMessage('Document soumis avec succes. Il sera examine sous 24-48h.');
      setSelectedFile(null);
      // Refresh list
      const updated = await verification.mine(token);
      setDocs(updated);
    } catch (err: any) {
      setMessage(err.message || 'Erreur lors de l\'envoi');
    }
    setUploading(false);
  }

  if (loading || fetching) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 700 }}>
          <div className="skeleton" style={{ height: 28, width: 200, marginBottom: '1.5rem' }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </section>
    );
  }

  const latestDoc = docs.length > 0 ? docs[docs.length - 1] : null;
  const isPending = latestDoc?.status === 'pending';
  const isApproved = latestDoc?.status === 'approved';
  const isRejected = latestDoc?.status === 'rejected';

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.25px' }}>
          Verification du compte
        </h1>

        {/* Current status */}
        {latestDoc && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Statut actuel</h2>
                <span className={`badge ${isApproved ? 'badge-green' : isPending ? 'badge-yellow' : 'badge-red'}`}>
                  {isApproved ? 'Verifie' : isPending ? 'En cours d\'examen' : 'Rejete'}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                <div>Type: {DOC_TYPES.find(d => d.value === latestDoc.type)?.label || latestDoc.type}</div>
                <div>Soumis le: {new Date(latestDoc.createdAt).toLocaleDateString('fr-MA')}</div>
              </div>

              {isRejected && latestDoc.rejectReason && (
                <div style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--red-50, #fef2f2)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  color: 'var(--red-700, #b91c1c)',
                }}>
                  <strong>Raison du rejet:</strong> {latestDoc.rejectReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload form — show if no docs, or if rejected */}
        {(!latestDoc || isRejected) && (
          <div className="card">
            <div className="card-body">
              <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                {isRejected ? 'Soumettre un nouveau document' : 'Verifier votre identite'}
              </h2>

              <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Pour devenir un prestataire verifie, soumettez une piece d&apos;identite valide.
                Votre document sera examine par notre equipe.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                    Type de document
                  </label>
                  <select
                    className="form-input"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    {DOC_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.375rem' }}>
                    Photo du document
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="form-input"
                    style={{ padding: '0.5rem' }}
                  />
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'Envoi en cours...' : 'Soumettre le document'}
                </button>
              </div>

              {message && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: message.includes('succes') ? 'var(--green-50, #f0fdf4)' : 'var(--red-50, #fef2f2)',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  color: message.includes('succes') ? 'var(--green-700, #15803d)' : 'var(--red-700, #b91c1c)',
                }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approved message */}
        {isApproved && (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green-500, #22c55e)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                Compte verifie
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Votre identite a ete verifiee. Un badge de verification apparait sur votre profil.
              </div>
            </div>
          </div>
        )}

        {isPending && (
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Document en cours d&apos;examen</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                Notre equipe examine votre document. Vous serez notifie une fois le processus termine (24-48h).
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
