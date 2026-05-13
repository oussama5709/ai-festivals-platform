'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../messages/en.json';
import fr from '../messages/fr.json';
import ar from '../messages/ar.json';

export type Locale = 'en' | 'fr' | 'ar';

const MESSAGES = { en, fr, ar } as const;

type Messages = typeof en;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Locale | null;
    if (stored && ['en', 'fr', 'ar'].includes(stored)) {
      applyLocale(stored);
      setLocaleState(stored);
    }
  }, []);

  function applyLocale(l: Locale) {
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
  }

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('lang', l);
    applyLocale(l);
  }

  function t(key: string): string {
    const parts = key.split('.');
    let value: unknown = MESSAGES[locale];
    for (const part of parts) {
      if (value && typeof value === 'object' && part in (value as object)) {
        value = (value as Record<string, unknown>)[part];
      } else {
        // fallback to en
        let fallback: unknown = MESSAGES['en'];
        for (const p of parts) {
          if (fallback && typeof fallback === 'object' && p in (fallback as object)) {
            fallback = (fallback as Record<string, unknown>)[p];
          } else return key;
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    return typeof value === 'string' ? value : key;
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
