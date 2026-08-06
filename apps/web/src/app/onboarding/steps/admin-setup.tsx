'use client';

import { useTranslations } from 'next-intl';

export interface AdminSetupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export default function AdminSetupStep({
  value,
  onChange,
}: {
  value: AdminSetupData;
  onChange: (data: AdminSetupData) => void;
}) {
  const t = useTranslations('onboarding');
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="first-name" className="block text-sm font-medium">
            {t('first_name')}
          </label>
          <input
            id="first-name"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={value.firstName}
            onChange={(e) => onChange({ ...value, firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="last-name" className="block text-sm font-medium">
            {t('last_name')}
          </label>
          <input
            id="last-name"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={value.lastName}
            onChange={(e) => onChange({ ...value, lastName: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-email" className="block text-sm font-medium">
          {t('email')}
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="admin-password" className="block text-sm font-medium">
          {t('password')}
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={value.password}
          onChange={(e) => onChange({ ...value, password: e.target.value })}
          placeholder={t('password_placeholder')}
          required
        />
      </div>
      <p className="text-xs text-slate-500">
        {t('admin_hint')}
      </p>
    </div>
  );
}