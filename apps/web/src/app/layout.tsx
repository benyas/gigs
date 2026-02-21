import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { AuthProvider } from '@/lib/auth-context';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <ServiceWorkerRegistrar />
        </AuthProvider>
      </body>
    </html>
  );
}
