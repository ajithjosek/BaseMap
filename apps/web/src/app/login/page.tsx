'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-50" />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations('login');
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('admin@basemap.com');
  const [password, setPassword] = useState('admin123');
  const [tenantSlug, setTenantSlug] = useState(searchParams.get('tenant') || 'default');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const router = useRouter();

  const handleSso = async () => {
    setSsoLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/sso/oidc/authorize', { tenantId: tenantSlug });
      window.location.href = res.data.authorizationUrl;
    } catch (err: any) {
      setError(err.response?.data?.message || t('sso_not_configured'));
      setSsoLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting login with:', { email, tenantSlug });
      const response = await api.post('/auth/login', {
        email,
        password,
        tenantId: tenantSlug,
      }, {
        headers: {
          'x-tenant-id': tenantSlug
        }
      });

      console.log('Login response:', response.data);
      const { access_token, user } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('tenant_id', user.tenantId);
      localStorage.setItem('user', JSON.stringify(user));

      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error full:', err);
      console.error('Login error response:', err.response);
      console.error('Login error message:', err.message);
      setError(err.response?.data?.message || err.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Card className="w-[400px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('title')}</CardTitle>
          <CardDescription>
            {t('subtitle')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="tenant">{t('tenant_slug')}</Label>
              <Input 
                id="tenant" 
                value={tenantSlug} 
                onChange={(e) => setTenantSlug(e.target.value)}
                placeholder="default"
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@basemap.com" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? t('logging_in') : t('login')}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">{t('or')}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" type="button" onClick={handleSso} disabled={ssoLoading}>
              {ssoLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('sign_in_sso')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
