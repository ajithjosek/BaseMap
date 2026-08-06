'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

import TenantInfoStep, { TenantInfoData } from './steps/tenant-info';
import AdminSetupStep, { AdminSetupData } from './steps/admin-setup';
import SsoConfigStep, { SsoConfigData } from './steps/sso-config';
import BrandingStep, { BrandingData } from './steps/branding';

const STEPS = ['Organization', 'Admin Account', 'SSO', 'Branding'];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const stepNames = [t('step_organization'), t('step_admin'), t('step_sso'), t('step_branding')];
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [tenantInfo, setTenantInfo] = useState<TenantInfoData>({
    name: '',
    slug: '',
    plan: 'starter',
  });
  const [admin, setAdmin] = useState<AdminSetupData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [sso, setSso] = useState<SsoConfigData>({
    enabled: false,
    provider: 'oidc',
    issuer: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
  });
  const [branding, setBranding] = useState<BrandingData>({
    logoUrl: '',
    primaryColor: '#0f766e',
  });

  const canProceed = () => {
    if (step === 0) return tenantInfo.name.trim() && tenantInfo.slug.trim();
    if (step === 1)
      return admin.firstName.trim() && admin.lastName.trim() && admin.email.trim() && admin.password.length >= 8;
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Provision the tenant
      const tenantRes = await api.post('/tenants', {
        name: tenantInfo.name,
        slug: tenantInfo.slug || undefined,
        plan: tenantInfo.plan,
        settings: {
          ...(sso.enabled
            ? {
                sso: {
                  enabled: true,
                  provider: sso.provider,
                  issuer: sso.issuer,
                  clientId: sso.clientId,
                  clientSecret: sso.clientSecret,
                  redirectUri: sso.redirectUri,
                },
              }
            : {}),
          ...(branding.logoUrl || branding.primaryColor
            ? { branding: { logo_url: branding.logoUrl, primary_color: branding.primaryColor } }
            : {}),
        },
      });

      const tenantId = tenantRes.data.id;

      // 2. Register the admin user
      await api.post('/auth/register', {
        email: admin.email,
        password: admin.password,
        firstName: admin.firstName,
        lastName: admin.lastName,
        tenantId,
      });

      router.push(`/login?tenant=${tenantInfo.slug}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('submit_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                {t('step_label', { current: step + 1, total: STEPS.length, name: stepNames[step] })}
              </p>
              <p className="text-sm text-slate-400">{Math.round(((step + 1) / STEPS.length) * 100)}%</p>
            </div>
            <Progress value={((step + 1) / STEPS.length) * 100} />
          </div>

          <div className="flex items-center gap-2">
            {stepNames.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                    i < step
                      ? 'bg-primary text-white'
                      : i === step
                        ? 'bg-primary/20 text-primary'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`hidden text-xs sm:inline ${i === step ? 'font-medium text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className="h-px w-4 bg-slate-200" />}
              </div>
            ))}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div aria-live="polite">
            {step === 0 && <TenantInfoStep value={tenantInfo} onChange={setTenantInfo} />}
            {step === 1 && <AdminSetupStep value={admin} onChange={setAdmin} />}
            {step === 2 && <SsoConfigStep value={sso} onChange={setSso} />}
            {step === 3 && <BrandingStep value={branding} onChange={setBranding} />}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0 || loading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> {t('back')}
            </Button>
            <Button onClick={handleNext} disabled={!canProceed() || loading}>
              {step === STEPS.length - 1 ? t('create_workspace') : t('continue')}
              {step < STEPS.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}