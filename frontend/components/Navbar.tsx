'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Brain } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/tunisia', label: '🇹🇳 Tunisia' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/api-docs', label: 'API' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Brain className="w-5 h-5 text-primary" aria-hidden />
          <span>AI Festivals</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
              aria-current={pathname === href ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/events"
            className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse events
          </Link>
          <div className="ml-2 pl-2 border-l border-border">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
