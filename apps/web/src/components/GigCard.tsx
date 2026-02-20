import Link from 'next/link';

interface GigCardProps {
  gig: {
    slug: string;
    title: string;
    description: string;
    basePrice: number;
    category?: { name: string };
    city?: { name: string };
    provider?: { profile?: { name: string; ratingAvg: number } };
  };
}

export function GigCard({ gig }: GigCardProps) {
  return (
    <Link href={`/gig/${gig.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card">
        <div
          style={{
            height: 160,
            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}
        >
          {gig.category?.name || 'Service'}
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {gig.category && <span className="badge badge-green">{gig.category.name}</span>}
            {gig.city && <span className="badge badge-blue">{gig.city.name}</span>}
          </div>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>{gig.title}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            {gig.description.slice(0, 100)}...
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="price">
              {gig.basePrice} MAD <small>/ service</small>
            </span>
            {gig.provider?.profile && (
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                <span className="stars">{'★'.repeat(Math.round(gig.provider.profile.ratingAvg))}</span>{' '}
                {gig.provider.profile.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
