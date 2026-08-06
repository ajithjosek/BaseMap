export const locales = ['en', 'pt-BR', 'de', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Locales rendered right-to-left. Add 'ar', 'he', etc. here as they ship.
export const rtlLocales: readonly string[] = [];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale);
}

export function textDirection(locale: string): 'ltr' | 'rtl' {
  return isRtl(locale) ? 'rtl' : 'ltr';
}

export const LOCALE_COOKIE = 'NEXT_LOCALE';