import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4001';
const TENANT_ID = __ENV.TENANT_ID || 'default';

let authToken = '';

export function setup() {
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@basemap.com',
    password: 'admin123',
    tenantId: TENANT_ID,
  }), {
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT_ID },
  });

  if (loginRes.status === 201) {
    const body = JSON.parse(loginRes.body as string);
    authToken = body.access_token;
  }
  return { token: authToken };
}

function headers(data: any) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`,
    'x-tenant-id': TENANT_ID,
  };
}

export default function (data: any) {
  const scenarios = [
    () => testApplicationsList(data),
    () => testApplicationsSearch(data),
    () => testCapabilitiesList(data),
    () => testInterfacesList(data),
    () => testCapabilityTree(data),
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 2 + 0.5);
}

function testApplicationsList(data: any) {
  const res = http.get(`${BASE_URL}/applications?limit=10`, { headers: headers(data) });

  const success = check(res, {
    'applications list status is 200': (r) => r.status === 200,
    'applications list has data': (r) => {
      try {
        const body = JSON.parse(r.body as string);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function testApplicationsSearch(data: any) {
  const res = http.get(`${BASE_URL}/applications?search=test&limit=5`, { headers: headers(data) });

  const success = check(res, {
    'applications search status is 200': (r) => r.status === 200,
  });

  errorRate.add(!success);
}

function testCapabilitiesList(data: any) {
  const res = http.get(`${BASE_URL}/capabilities`, { headers: headers(data) });

  const success = check(res, {
    'capabilities list status is 200': (r) => r.status === 200,
    'capabilities list is array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body as string));
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function testInterfacesList(data: any) {
  const res = http.get(`${BASE_URL}/interfaces`, { headers: headers(data) });

  const success = check(res, {
    'interfaces list status is 200': (r) => r.status === 200,
  });

  errorRate.add(!success);
}

function testCapabilityTree(data: any) {
  const res = http.get(`${BASE_URL}/capabilities/tree`, { headers: headers(data) });

  const success = check(res, {
    'capability tree status is 200': (r) => r.status === 200,
  });

  errorRate.add(!success);
}
