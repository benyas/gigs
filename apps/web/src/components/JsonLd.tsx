export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gigs.ma',
    url: 'https://gigs.ma',
    description: 'Trouvez les meilleurs prestataires de services pres de chez vous au Maroc.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://gigs.ma/browse?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function gigJsonLd(gig: any) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: gig.title,
    description: gig.description,
    url: `https://gigs.ma/gig/${gig.slug}`,
    provider: {
      '@type': 'LocalBusiness',
      name: gig.provider?.profile?.name || 'Prestataire',
      address: {
        '@type': 'PostalAddress',
        addressLocality: gig.city?.name,
        addressCountry: 'MA',
      },
    },
    areaServed: {
      '@type': 'City',
      name: gig.city?.name,
    },
    offers: {
      '@type': 'Offer',
      price: gig.basePrice,
      priceCurrency: 'MAD',
      availability: gig.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    category: gig.category?.name,
  };

  if (gig.provider?.profile?.ratingCount > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: gig.provider.profile.ratingAvg,
      reviewCount: gig.provider.profile.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return data;
}

export function providerJsonLd(provider: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: provider.profile?.name,
    description: provider.profile?.bio,
    address: {
      '@type': 'PostalAddress',
      addressLocality: provider.profile?.city?.name,
      addressCountry: 'MA',
    },
    ...(provider.profile?.ratingCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: provider.profile.ratingAvg,
        reviewCount: provider.profile.ratingCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd(items: { name: string; url: string; position: number }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      url: item.url,
      name: item.name,
    })),
  };
}
