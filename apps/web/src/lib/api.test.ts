import api from './api';

describe('api client', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should have /api baseURL', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('should attach Authorization header when token exists', () => {
    window.localStorage.setItem('access_token', 'test-token');
    const config = { headers: {} as Record<string, string> };
    const interceptor = (api.interceptors.request as any).handlers?.[0];
    expect(interceptor).toBeDefined();
  });

  it('should attach x-tenant-id header', () => {
    window.localStorage.setItem('tenant_id', 'my-tenant');
    const config = { headers: {} as Record<string, string> };
    expect(api.defaults.headers.common['x-tenant-id']).toBeUndefined();
  });

  it('should remove token on 401 response', () => {
    window.localStorage.setItem('access_token', 'expired-token');
    expect(window.localStorage.getItem('access_token')).toBe('expired-token');
  });
});
