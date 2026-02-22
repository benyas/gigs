'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function PaymentResult() {
  const params = useSearchParams();
  const status = params.get('status') || params.get('ProcReturnCode');
  const orderId = params.get('oid') || params.get('orderId') || '';

  const isSuccess = status === '00' || status === 'success';
  const isFailed = !isSuccess;

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 500, textAlign: 'center' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '3rem 2rem' }}>
            {isSuccess ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--green-500, #22c55e)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Paiement reussi
                </h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Votre paiement a ete traite avec succes. Le prestataire a ete notifie.
                </p>
                {orderId && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginBottom: '1.5rem' }}>
                    Reference: {orderId}
                  </div>
                )}
                <Link href="/dashboard/my-bookings" className="btn btn-primary" style={{ width: '100%' }}>
                  Voir mes reservations
                </Link>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--red-500, #ef4444)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  Paiement echoue
                </h1>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Le paiement n&apos;a pas pu etre traite. Aucun montant n&apos;a ete debite.
                  Vous pouvez reessayer depuis vos reservations.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link href="/dashboard/my-bookings" className="btn btn-primary" style={{ width: '100%' }}>
                    Retour aux reservations
                  </Link>
                  <Link href="/browse" className="btn btn-outline" style={{ width: '100%' }}>
                    Parcourir les services
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <section className="section">
        <div className="container" style={{ maxWidth: 500, textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </section>
    }>
      <PaymentResult />
    </Suspense>
  );
}
