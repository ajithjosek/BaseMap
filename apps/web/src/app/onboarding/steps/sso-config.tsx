'use client';

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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-input bg-background p-4">
        <div>
          <p className="font-medium">Enable Single Sign-On</p>
          <p className="text-sm text-slate-500">
            Allow your team to sign in with your identity provider (Okta, Azure AD, etc.)
          </p>
        </div>
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="h-4 w-4 rounded border border-input"
          />
          <span className="ml-2 text-sm font-medium">{value.enabled ? 'On' : 'Off'}</span>
        </label>
      </div>

      {value.enabled && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium">Provider &amp; Protocol</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={value.provider}
              onChange={(e) => onChange({ ...value, provider: e.target.value as 'oidc' | 'saml' })}
            >
              <option value="oidc">OIDC (Okta, Azure AD)</option>
              <option value="saml">SAML 2.0</option>
            </select>
          </div>
          {value.provider === 'oidc' ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Issuer URL</label>
                <input
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  placeholder="https://your-tenant.okta.com/oauth2/default"
                  value={value.issuer}
                  onChange={(e) => onChange({ ...value, issuer: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Client ID</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={value.clientId}
                    onChange={(e) => onChange({ ...value, clientId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Client Secret</label>
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
                SAML Metadata URL (IdP)
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                placeholder="https://idp.example.com/saml/metadata"
                value={value.issuer}
                onChange={(e) => onChange({ ...value, issuer: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Redirect URI</label>
            <input
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              placeholder="https://basemap.io/auth/sso/oidc/callback"
              value={value.redirectUri}
              onChange={(e) => onChange({ ...value, redirectUri: e.target.value })}
            />
          </div>
          <p className="text-xs text-slate-500">You can skip this and configure SSO later from Settings.</p>
        </>
      )}
    </div>
  );
}