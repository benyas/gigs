import Link from 'next/link';
import { gigs } from '@/lib/api';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export default async function GigDetailPage({ params }: Props) {
  let gig: any;
  try {
    gig = await gigs.getBySlug(params.slug);
  } catch {
    notFound();
  }

  const reviews = gig.bookings
    ?.filter((b: any) => b.review)
    .map((b: any) => b.review) || [];

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem' }}>
          <Link href="/browse" style={{ color: '#6b7280' }}>&larr; Retour aux services</Link>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div
            style={{
              height: 250,
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
            }}
          >
            {gig.category?.name}
          </div>
          <div className="card-body" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <span className="badge badge-green">{gig.category?.name}</span>
              <span className="badge badge-blue">{gig.city?.name}</span>
              <span className="badge badge-yellow">{gig.status}</span>
            </div>

            <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>{gig.title}</h1>

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <span className="price">
                {gig.basePrice} MAD <small>/ service</small>
              </span>
              {gig.provider?.profile && (
                <Link
                  href={`/provider/${gig.provider.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span className="stars">
                    {'★'.repeat(Math.round(gig.provider.profile.ratingAvg))}
                  </span>
                  <strong>{gig.provider.profile.name}</strong>
                  {gig.provider.profile.isVerified && (
                    <span className="badge badge-green">Vérifié</span>
                  )}
                </Link>
              )}
            </div>

            <div style={{ lineHeight: 1.8, marginBottom: '2rem' }}>
              {gig.description}
            </div>

            <Link
              href={`/auth/login`}
              className="btn btn-primary"
              style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}
            >
              Réserver ce service
            </Link>
          </div>
        </div>

        {reviews.length > 0 && (
          <div>
            <h2 className="section-title">Avis ({reviews.length})</h2>
            {reviews.map((review: any) => (
              <div key={review.id} className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span className="stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                      {new Date(review.createdAt).toLocaleDateString('fr-MA')}
                    </span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
