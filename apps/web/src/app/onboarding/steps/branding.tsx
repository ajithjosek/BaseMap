'use client';

import { useTranslations } from 'next-intl';

export interface BrandingData {
  logoUrl: string;
  primaryColor: string;
}

const PRESET_COLORS = ['#0f52ba', '#16a34a', '#7c3aed', '#dc2626', '#ea580c'];

export default function BrandingStep({
  value,
  onChange,
}: {
  value: BrandingData;
  onChange: (data: BrandingData) => void;
}) {
  const t = useTranslations('onboarding');
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="logo-url" className="block text-sm font-medium">
          {t('logo_url')}
        </label>
        <input
          id="logo-url"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          placeholder={t('logo_url_placeholder')}
          value={value.logoUrl}
          onChange={(e) => onChange({ ...value, logoUrl: e.target.value })}
        />
        <p className="text-xs text-slate-500">
          {t('logo_hint')}
        </p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t('primary_color')}</label>
        <div className="flex items-center gap-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={t('select_color', { color })}
              onClick={() => onChange({ ...value, primaryColor: color })}
              className={`h-9 w-9 rounded-full border-2 transition-transform ${
                value.primaryColor === color ? 'scale-110 border-slate-800' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
          <input
            type="color"
            aria-label={t('custom_color')}
            value={value.primaryColor || '#0f766e'}
            onChange={(e) => onChange({ ...value, primaryColor: e.target.value })}
            className="h-9 w-14 cursor-pointer rounded border border-input bg-transparent"
          />
        </div>
      </div>
      <p className="text-xs text-slate-500">{t('change_later')}</p>
    </div>
  );
}