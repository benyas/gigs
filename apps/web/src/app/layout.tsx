import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Gigs.ma - Services à domicile au Maroc',
  description:
    'Trouvez les meilleurs prestataires de services près de chez vous. Plomberie, électricité, ménage, déménagement et plus.',
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
