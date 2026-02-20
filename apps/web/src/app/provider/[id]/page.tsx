import Link from 'next/link';
import { reviews as reviewsApi } from '@/lib/api';

interface Props {
  params: { id: string };
}

export default async function ProviderProfilePage({ params }: Props) {
  let reviewsList: any[] = [];
  let meta = { total: 0 };

  try {
    const res = await reviewsApi.listForProvider(params.id);
    reviewsList = res.data;
    meta = res.meta;
  } catch {
    // Provider not found or API down
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/browse" style={{ color: '#6b7280' }}>&larr; Retour</Link>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body" style={{ padding: '2rem', textAlign: 'center' }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669, #047857)',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 700,
              }}
            >
              P
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Profil du prestataire</h1>
            <p style={{ color: '#6b7280' }}>
              {meta.total} avis au total
            </p>
          </div>
        </div>

        <h2 className="section-title">Avis reçus</h2>

        {reviewsList.length > 0 ? (
          reviewsList.map((review: any) => (
            <div key={review.id} className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    {review.client?.profile && (
                      <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>
                        {review.client.profile.name}
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {new Date(review.createdAt).toLocaleDateString('fr-MA')}
                  </span>
                </div>
                <p>{review.comment}</p>
                {review.booking?.gig && (
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    Service : {review.booking.gig.title}
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
            Aucun avis pour le moment.
          </p>
        )}
      </div>
    </section>
  );
}
