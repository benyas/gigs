import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

const CITIES = [
  { name: 'Casablanca', region: 'Casablanca-Settat' },
  { name: 'Rabat', region: 'Rabat-Salé-Kénitra' },
  { name: 'Marrakech', region: 'Marrakech-Safi' },
  { name: 'Fès', region: 'Fès-Meknès' },
  { name: 'Tanger', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Agadir', region: 'Souss-Massa' },
  { name: 'Meknès', region: 'Fès-Meknès' },
  { name: 'Oujda', region: 'Oriental' },
  { name: 'Kénitra', region: 'Rabat-Salé-Kénitra' },
  { name: 'Tétouan', region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Salé', region: 'Rabat-Salé-Kénitra' },
  { name: 'Nador', region: 'Oriental' },
  { name: 'Mohammedia', region: 'Casablanca-Settat' },
  { name: 'El Jadida', region: 'Casablanca-Settat' },
  { name: 'Béni Mellal', region: 'Béni Mellal-Khénifra' },
];

const CATEGORIES = [
  { name: 'Plomberie', slug: 'plomberie', icon: 'wrench' },
  { name: 'Électricité', slug: 'electricite', icon: 'zap' },
  { name: 'Ménage', slug: 'menage', icon: 'sparkles' },
  { name: 'Déménagement', slug: 'demenagement', icon: 'package' },
  { name: 'Peinture', slug: 'peinture', icon: 'paintbrush' },
  { name: 'Jardinage', slug: 'jardinage', icon: 'flower' },
  { name: 'Réparation', slug: 'reparation', icon: 'hammer' },
  { name: 'Cours particuliers', slug: 'cours-particuliers', icon: 'book' },
  { name: 'Photographie', slug: 'photographie', icon: 'camera' },
  { name: 'Traiteur', slug: 'traiteur', icon: 'utensils' },
];

async function main() {
  console.log('Seeding database...');

  // Cities
  const cities = await Promise.all(
    CITIES.map((city) =>
      prisma.city.upsert({
        where: { name: city.name },
        update: {},
        create: city,
      }),
    ),
  );
  console.log(`Created ${cities.length} cities`);

  // Categories
  const categories = await Promise.all(
    CATEGORIES.map((cat) =>
      prisma.category.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      }),
    ),
  );
  console.log(`Created ${categories.length} categories`);

  // Demo users
  const passwordHash = await bcrypt.hash('password123', 12);

  const provider = await prisma.user.upsert({
    where: { phone: '+212600000001' },
    update: {},
    create: {
      phone: '+212600000001',
      email: 'provider@gigs.ma',
      passwordHash,
      role: 'provider',
      profile: {
        create: {
          name: 'Youssef El Amrani',
          bio: 'Plombier professionnel avec 10 ans d\'expérience à Casablanca. Travail soigné et rapide.',
          cityId: cities[0].id, // Casablanca
          isVerified: true,
          ratingAvg: 4.8,
          ratingCount: 25,
        },
      },
    },
    include: { profile: true },
  });

  const client = await prisma.user.upsert({
    where: { phone: '+212600000002' },
    update: {},
    create: {
      phone: '+212600000002',
      email: 'client@gigs.ma',
      passwordHash,
      role: 'client',
      profile: {
        create: {
          name: 'Fatima Zahra',
          cityId: cities[0].id,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { phone: '+212600000000' },
    update: {},
    create: {
      phone: '+212600000000',
      email: 'admin@gigs.ma',
      passwordHash,
      role: 'admin',
      profile: {
        create: {
          name: 'Admin Gigs.ma',
          isVerified: true,
        },
      },
    },
  });

  console.log('Created demo users (admin + provider + client)');

  // Demo gigs
  const demoGigs = [
    {
      title: 'Réparation de fuites d\'eau',
      description:
        'Je répare tous types de fuites d\'eau : robinets, tuyaux, chauffe-eau, sanitaires. Intervention rapide dans tout Casablanca. Devis gratuit et travail garanti. Plus de 10 ans d\'expérience dans la plomberie professionnelle.',
      basePrice: 200,
      categoryIndex: 0, // Plomberie
      cityIndex: 0, // Casablanca
    },
    {
      title: 'Installation électrique complète',
      description:
        'Installation et mise aux normes de votre réseau électrique. Tableaux, prises, éclairage, domotique. Certification de conformité incluse. Travail propre et soigné avec les meilleurs matériaux disponibles sur le marché.',
      basePrice: 500,
      categoryIndex: 1, // Électricité
      cityIndex: 0, // Casablanca
    },
    {
      title: 'Ménage professionnel à domicile',
      description:
        'Service de ménage professionnel pour appartements et villas. Nettoyage en profondeur, repassage, organisation. Produits écologiques fournis. Équipe de confiance avec références vérifiables.',
      basePrice: 150,
      categoryIndex: 2, // Ménage
      cityIndex: 1, // Rabat
    },
  ];

  for (const gigData of demoGigs) {
    const slug = slugify(gigData.title, { lower: true, strict: true });
    await prisma.gig.upsert({
      where: { slug },
      update: {},
      create: {
        providerId: provider.id,
        categoryId: categories[gigData.categoryIndex].id,
        title: gigData.title,
        slug,
        description: gigData.description,
        basePrice: gigData.basePrice,
        cityId: cities[gigData.cityIndex].id,
        status: 'active',
      },
    });
  }
  console.log('Created 3 demo gigs');

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
