import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Festivals — Global AI Events & Conferences',
  description:
    'Discover AI conferences, workshops, hackathons, and meetups worldwide. Updated daily from 100+ sources across 200+ countries.',
  keywords: ['AI events', 'machine learning conferences', 'AI festivals', 'AI workshops'],
  openGraph: {
    title: 'AI Festivals — Global AI Events',
    description: 'Discover AI events worldwide, updated daily.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
