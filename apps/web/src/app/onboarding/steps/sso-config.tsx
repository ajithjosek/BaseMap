'use client';

import { useTranslations } from 'next-intl';

export interface SsoConfigData {
  enabled: boolean;
  provider: 'oidc' | 'saml';
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export default function SsoConfigStep({
  value,
  onChange,
}: {
  value: SsoConfigData;
  onChange: (data: SsoConfigData) => void;
}) {
  const t = useTranslations('onboarding');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-input bg-background p-4">
        <div>
          <p className="font-medium">{t('enable_sso')}</p>
          <p className="text-sm text-slate-500">
            {t('sso_desc')}
          </p>
        </div>
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="h-4 w-4 rounded border border-input"
          />
          <span className="ml-2 text-sm font-medium">{value.enabled ? t('on') : t('off')}</span>
        </label>
      </div>

      {value.enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('provider_protocol')}</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={value.provider}
              onChange={(e) => onChange({ ...value, provider: e.target.value as 'oidc' | 'saml' })}
            >
              <option value="oidc">{t('oidc_option')}</option>
              <option value="saml">{t('saml_option')}</option>
            </select>
          </div>
          {value.provider === 'oidc' ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium">{t('issuer_url')}</label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  placeholder={t('issuer_url_placeholder')}
                  value={value.issuer}
                  onChange={(e) => onChange({ ...value, issuer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('client_id')}</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={value.clientId}
                    onChange={(e) => onChange({ ...value, clientId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">{t('client_secret')}</label>
                  <input
                    type="password"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={value.clientSecret}
                    onChange={(e) => onChange({ ...value, clientSecret: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {t('saml_metadata_url')}
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder={t('saml_metadata_placeholder')}
                value={value.issuer}
                onChange={(e) => onChange({ ...value, issuer: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t('redirect_uri')}</label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder={t('redirect_uri_placeholder')}
              value={value.redirectUri}
              onChange={(e) => onChange({ ...value, redirectUri: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-500">{t('skip_sso_hint')}</p>
        </>
      )}
    </div>
  );
}