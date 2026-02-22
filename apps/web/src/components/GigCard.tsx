import Link from 'next/link';
import Image from 'next/image';
import { StarRating, CategoryIcon, VerifiedBadge } from './Icons';
import { FavoriteButton } from './FavoriteButton';

interface GigCardProps {
  gig: {
    id?: string;
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
  const rating = gig.provider?.profile?.ratingAvg || 0;
  const ratingCount = gig.provider?.profile?.ratingCount || 0;

  return (
    <Link href={`/gig/${gig.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card card-interactive" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Image */}
        <div style={{
          height: 180,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {hasImage ? (
            <Image
              src={gig.media![0].url}
              alt={gig.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 280px"
              style={{ objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}>
              <CategoryIcon icon={gig.category?.icon} size={32} />
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {gig.category?.name || 'Service'}
              </span>
            </div>
          )}
          {/* Favorite button overlay */}
          {gig.id && (
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
              <FavoriteButton gigId={gig.id} size={18} />
            </div>
          )}
          {/* Price badge overlay */}
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'var(--card)',
            padding: '0.25rem 0.625rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'var(--primary)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            {gig.basePrice} MAD
          </div>
        </div>

        {/* Content */}
        <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Tags */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
            {gig.category && <span className="badge badge-green">{gig.category.name}</span>}
            {gig.city && <span className="badge badge-blue">{gig.city.name}</span>}
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--gray-900)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {gig.title}
          </h3>

          {/* Description */}
          <p style={{
            color: 'var(--gray-500)',
            fontSize: '0.825rem',
            lineHeight: 1.5,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {gig.description}
          </p>

          {/* Footer */}
          {gig.provider?.profile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '0.625rem',
              borderTop: '1px solid var(--border-light)',
              marginTop: 'auto',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="avatar-sm" style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                }}>
                  {gig.provider.profile.name?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontWeight: 500 }}>
                  {gig.provider.profile.name?.split(' ')[0]}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                {rating > 0 && (
                  <>
                    <StarRating rating={rating} size={12} />
                    <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{rating.toFixed(1)}</span>
                    {ratingCount > 0 && (
                      <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>({ratingCount})</span>
                    )}
                  </>
                )}
                {gig.provider.profile.isVerified && (
                  <VerifiedBadge size={14} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
