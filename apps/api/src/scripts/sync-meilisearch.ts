import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

const GIGS_INDEX = 'gigs';

async function main() {
  const prisma = new PrismaClient();
  const meili = new MeiliSearch({
    host: process.env.MEILISEARCH_URL || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || 'gigs_master_key',
  });

  console.log('Setting up Meilisearch index...');

  const index = meili.index(GIGS_INDEX);
  await index.updateSettings({
    searchableAttributes: ['title', 'description', 'categoryName', 'cityName', 'providerName'],
    filterableAttributes: ['categoryId', 'cityId', 'basePrice', 'status'],
    sortableAttributes: ['basePrice', 'createdAt'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  });

  console.log('Fetching all gigs from database...');

  const gigs = await prisma.gig.findMany({
    include: {
      category: true,
      city: true,
      provider: { include: { profile: true } },
    },
  });

  console.log(`Found ${gigs.length} gigs. Indexing...`);

  const docs = gigs.map((gig) => ({
    id: gig.id,
    title: gig.title,
    slug: gig.slug,
    description: gig.description,
    basePrice: gig.basePrice,
    status: gig.status,
    categoryId: gig.categoryId,
    categoryName: gig.category.name,
    cityId: gig.cityId,
    cityName: gig.city.name,
    providerName: gig.provider.profile?.name || '',
    createdAt: gig.createdAt.getTime(),
  }));

  if (docs.length > 0) {
    await index.addDocuments(docs);
  }

  console.log(`Indexed ${docs.length} gigs in Meilisearch.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
