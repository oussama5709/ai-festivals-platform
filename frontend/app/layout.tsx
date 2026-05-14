import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar';

const BASE_URL = 'https://ai-festivals-platform.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'AI Festivals — Global AI Events & Conferences',
    template: '%s | AI Festivals',
  },
  description:
    'Discover AI conferences, workshops, hackathons, and meetups worldwide. Updated daily from 100+ sources across 200+ countries.',
  keywords: ['AI events', 'machine learning conferences', 'AI festivals', 'AI workshops', 'NeurIPS', 'ICML', 'hackathon'],
  openGraph: {
    title: 'AI Festivals — Global AI Events & Conferences',
    description: 'Discover AI conferences, workshops, hackathons, and meetups worldwide. Updated daily.',
    type: 'website',
    url: BASE_URL,
    siteName: 'AI Festivals',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AI Festivals — Global AI Events' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Festivals — Global AI Events & Conferences',
    description: 'Discover AI events worldwide. Updated daily from 100+ sources.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        <ServiceWorkerRegistrar />
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
