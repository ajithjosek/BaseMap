import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') || 'default' : 'default';

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  config.headers['x-tenant-id'] = tenantId;
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Login/SSO endpoints return 401 on bad credentials; let the caller render
    // the error instead of bouncing the page back to /login.
    const isAuthRequest =
      typeof error.config?.url === 'string' && error.config.url.includes('/auth/');

    if (error.response?.status === 401 && !isAuthRequest && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
