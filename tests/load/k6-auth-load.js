import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4001';
const TENANT_ID = __ENV.TENANT_ID || 'default';

export default function () {
  const scenarios = [
    () => testLogin(),
    () => testRegister(),
    () => testRefresh(),
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 2 + 0.5);
}

function testLogin() {
  const payload = JSON.stringify({
    email: 'admin@basemap.com',
    password: 'admin123',
    tenantId: TENANT_ID,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
    },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);

  const success = check(res, {
    'login status is 201': (r) => r.status === 201,
    'login returns access_token': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return body.access_token !== undefined;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function testRegister() {
  const uniqueEmail = `loadtest${Date.now()}@example.com`;
  const payload = JSON.stringify({
    email: uniqueEmail,
    password: 'TestPassword123!',
    firstName: 'Load',
    lastName: 'Test',
    tenantId: TENANT_ID,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
    },
  };

  const res = http.post(`${BASE_URL}/auth/register`, payload, params);

  const success = check(res, {
    'register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  errorRate.add(!success);
}

function testRefresh() {
  // First get a token
  const loginPayload = JSON.stringify({
    email: 'admin@basemap.com',
    password: 'admin123',
    tenantId: TENANT_ID,
  });

  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, loginParams);
  if (loginRes.status !== 201) return;

  let refreshToken: string;
  try {
    const body = JSON.parse(loginRes.body as string);
    refreshToken = body.refresh_token;
  } catch {
    return;
  }

  const refreshPayload = JSON.stringify({ refresh_token: refreshToken });

  const res = http.post(`${BASE_URL}/auth/refresh`, refreshPayload, loginParams);

  const success = check(res, {
    'refresh status is 201': (r) => r.status === 201,
  });

  errorRate.add(!success);
}
