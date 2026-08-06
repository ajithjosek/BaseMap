'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { locales, LOCALE_COOKIE } from '@/i18n/config';

export function LocaleSwitcher() {
  const t = useTranslations('locale');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1" title={t('switcher_label')}>
      <Languages size={16} className="text-slate-400" aria-hidden />
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          aria-label={t(l)}
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
            locale === l
              ? 'bg-blue-600 text-white font-medium'
              : 'text-slate-400 hover:text-white'
          } ${pathname === '/login' ? '' : ''}`}
        >
          {t(l)}
        </button>
      ))}
    </div>
  );
}