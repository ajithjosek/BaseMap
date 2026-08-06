'use client';

import { useTranslations } from 'next-intl';

export interface TenantInfoData {
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
}

export default function TenantInfoStep({
  value,
  onChange,
}: {
  value: TenantInfoData;
  onChange: (data: TenantInfoData) => void;
}) {
  const t = useTranslations('onboarding');
  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="tenant-name" className="block text-sm font-medium">
          {t('org_name')}
        </label>
        <input
          id="tenant-name"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
          placeholder={t('org_name_placeholder')}
          value={value.name}
          onChange={(e) =>
            onChange({ ...value, name: e.target.value, slug: value.slug || slugify(e.target.value) })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="tenant-slug" className="block text-sm font-medium">
          {t('slug')}
        </label>
        <div className="flex items-center rounded-md border border-input bg-background px-3 text-sm">
          <span className="text-slate-400">{t('slug_prefix')}</span>
          <input
            id="tenant-slug"
            className="flex-1 h-9 bg-transparent outline-none"
            value={value.slug}
            onChange={(e) => onChange({ ...value, slug: slugify(e.target.value) })}
            placeholder={t('slug_placeholder')}
            required
          />
        </div>
        <p className="text-xs text-slate-500">{t('slug_hint')}</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">{t('plan')}</label>
        <div className="grid grid-cols-3 gap-3">
          {(['starter', 'professional', 'enterprise'] as const).map((plan) => (
            <button
              key={plan}
              type="button"
              onClick={() => onChange({ ...value, plan })}
              className={`rounded-lg border p-3 text-left transition-colors ${
                value.plan === plan
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-slate-300'
              }`}
            >
              <p className="font-medium capitalize">{plan}</p>
              <p className="text-xs text-slate-500">
                {t(`plan_${plan}_desc`)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
