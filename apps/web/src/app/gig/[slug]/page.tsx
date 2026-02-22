import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { gigs } from '@/lib/api';
import GigDetailClient from './gig-detail-client';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const gig = await gigs.getBySlug(params.slug);
    return {
      title: `${gig.title} | Gigs.ma`,
      description: gig.description?.slice(0, 160),
      openGraph: {
        title: gig.title,
        description: gig.description?.slice(0, 160),
        images: gig.media?.[0]?.url ? [gig.media[0].url] : undefined,
      },
    };
  } catch {
    return { title: 'Service non trouve | Gigs.ma' };
  }
}

export default async function GigDetailPage({ params }: Props) {
  let gig: any;
  try {
    gig = await gigs.getBySlug(params.slug);
  } catch {
    notFound();
  }

  return <GigDetailClient gig={gig} />;
}
