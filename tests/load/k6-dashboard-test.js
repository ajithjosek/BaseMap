import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 250 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 250 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4001';
const API_TOKEN = __env.API_TOKEN || 'test-token';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
  'X-Tenant-ID': 'test-tenant-id',
};

export default function () {
  const scenarios = [
    () => testExecutiveDashboard(),
    () => testFinancialDashboard(),
    () => testRiskDashboard(),
    () => testGraphQLQuery(),
    () => testSearchEndpoint(),
    () => testApplicationsList(),
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario();

  sleep(Math.random() * 2 + 0.5);
}

function testExecutiveDashboard() {
  const res = http.get(`${BASE_URL}/dashboards/executive`, { headers });

  const success = check(res, {
    'executive dashboard status is 200': (r) => r.status === 200,
    'executive dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

function testFinancialDashboard() {
  const res = http.get(`${BASE_URL}/dashboards/financial`, { headers });

  const success = check(res, {
    'financial dashboard status is 200': (r) => r.status === 200,
    'financial dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

function testRiskDashboard() {
  const res = http.get(`${BASE_URL}/dashboards/risk`, { headers });

  const success = check(res, {
    'risk dashboard status is 200': (r) => r.status === 200,
    'risk dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

function testGraphQLQuery() {
  const query = JSON.stringify({
    query: `
      query {
        applications(limit: 10) {
          id
          name
          lifecycleState
          riskScore
        }
      }
    `,
  });

  const res = http.post(`${BASE_URL}/graphql`, query, { headers });

  const success = check(res, {
    'graphql query status is 200': (r) => r.status === 200,
    'graphql response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

function testSearchEndpoint() {
  const res = http.get(`${BASE_URL}/interfaces?search=test`, { headers });

  const success = check(res, {
    'search endpoint status is 200': (r) => r.status === 200,
    'search response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

function testApplicationsList() {
  const res = http.get(`${BASE_URL}/applications?limit=20`, { headers });

  const success = check(res, {
    'applications list status is 200': (r) => r.status === 200,
    'applications list response time < 2s': (r) => r.timings.duration < 2000,
  });

  errorRate.add(!success);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data),
    'tests/load/summary.json': JSON.stringify(data),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  return `
==============================================
K6 Load Test Results - BaseMap Phase 4 Exit
==============================================

Test Duration: ${data.state.testDurationMs / 1000}s
Total Requests: ${metrics.http_reqs.values.count}
Failed Requests: ${metrics.http_req_failed.values.passes}

Performance Metrics:
-------------------
HTTP Response Time (avg): ${metrics.http_req_duration.values.avg.toFixed(2)}ms
HTTP Response Time (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
HTTP Response Time (max): ${metrics.http_req_duration.values.max.toFixed(2)}ms

Error Rate: ${(metrics.errors.values.passes / metrics.http_reqs.values.count * 100).toFixed(2)}%

SLA Verification:
----------------
Response Time p(95) < 2000ms: ${metrics.http_req_duration.values['p(95)'] < 2000 ? 'PASS' : 'FAIL'}
Error Rate < 5%: ${metrics.http_req_failed.values.passes / metrics.http_reqs.values.count < 0.05 ? 'PASS' : 'FAIL'}
==============================================
  `.trim();
}