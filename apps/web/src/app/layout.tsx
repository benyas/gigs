import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { LayoutShell } from '@/components/layout-shell';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { AuthProvider } from '@/lib/auth-context';
import { isRtl } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: 'Gigs.ma - Services a domicile au Maroc',
    template: '%s | Gigs.ma',
  },
  description:
    'Trouvez les meilleurs prestataires de services pres de chez vous. Plomberie, electricite, menage, demenagement et plus.',
  keywords: ['services', 'prestataires', 'Maroc', 'plombier', 'electricien', 'menage', 'reparation', 'demenagement'],
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    siteName: 'Gigs.ma',
    title: 'Gigs.ma - Services a domicile au Maroc',
    description: 'Trouvez les meilleurs prestataires de services pres de chez vous au Maroc.',
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gigs.ma',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale() as Locale;
  const messages = await getMessages();
  const rtl = isRtl(locale);

  return (
    <html lang={locale} dir={rtl ? 'rtl' : 'ltr'} className={inter.className}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
            <ServiceWorkerRegistrar />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
