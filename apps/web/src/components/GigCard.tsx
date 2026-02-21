import Link from 'next/link';

interface GigCardProps {
  gig: {
    slug: string;
    title: string;
    description: string;
    basePrice: number;
    category?: { name: string; icon?: string };
    city?: { name: string };
    media?: { url: string }[];
    provider?: { id?: string; profile?: { name: string; ratingAvg: number; ratingCount: number; isVerified?: boolean } };
  };
}

export function GigCard({ gig }: GigCardProps) {
  const hasImage = gig.media && gig.media.length > 0;

  return (
    <Link href={`/gig/${gig.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}>
        <div
          style={{
            height: 160,
            background: hasImage
              ? `url(${gig.media![0].url}) center/cover`
              : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: hasImage ? '0' : '1.5rem',
            color: '#059669',
            fontWeight: 600,
            borderRadius: '12px 12px 0 0',
          }}
        >
          {!hasImage && (gig.category?.icon || gig.category?.name || 'Service')}
        </div>
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {gig.category && <span className="badge badge-green">{gig.category.name}</span>}
            {gig.city && <span className="badge badge-blue">{gig.city.name}</span>}
          </div>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>{gig.title}</h3>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.75rem', flex: 1 }}>
            {gig.description.length > 100 ? gig.description.slice(0, 100) + '...' : gig.description}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
              {gig.basePrice} MAD
            </span>
            {gig.provider?.profile && (
              <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                <span className="stars">{'★'.repeat(Math.round(gig.provider.profile.ratingAvg))}</span>
                {gig.provider.profile.ratingCount > 0 && ` (${gig.provider.profile.ratingCount})`}
                {gig.provider.profile.isVerified && <span style={{ color: 'var(--primary)', marginLeft: '0.25rem' }}>&#10003;</span>}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
