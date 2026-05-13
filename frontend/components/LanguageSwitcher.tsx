'use client';

import { useI18n, Locale } from '@/lib/i18n';

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'ar', label: 'AR', flag: '🇹🇳' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Language selector">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-2 py-1 text-xs rounded-md transition-all ${
            locale === lang.code
              ? 'bg-foreground text-background font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
          aria-label={`Switch to ${lang.label}`}
          aria-pressed={locale === lang.code}
        >
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
}
