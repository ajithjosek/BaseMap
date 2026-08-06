'use client';

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
          Organization Name
        </label>
        <input
          id="tenant-name"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
          placeholder="Acme Corp"
          value={value.name}
          onChange={(e) =>
            onChange({ ...value, name: e.target.value, slug: value.slug || slugify(e.target.value) })
          }
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="tenant-slug" className="block text-sm font-medium">
          Slug
        </label>
        <div className="flex items-center rounded-md border border-input bg-background px-3 text-sm">
          <span className="text-slate-400">basemap.io/</span>
          <input
            id="tenant-slug"
            className="flex-1 h-9 bg-transparent outline-none"
            value={value.slug}
            onChange={(e) => onChange({ ...value, slug: slugify(e.target.value) })}
            placeholder="acme-corp"
            required
          />
        </div>
        <p className="text-xs text-slate-500">Unique identifier for your workspace URL.</p>
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Plan</label>
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
                {plan === 'starter' && 'Up to 100 requests/min'}
                {plan === 'professional' && 'Up to 500 requests/min'}
                {plan === 'enterprise' && 'Up to 2000 requests/min'}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
