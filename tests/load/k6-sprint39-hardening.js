import { http } from 'k6';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  // Sprint 39.1 - performance regression vs the Sprint 32 baseline.
  stages: [
    { duration: '30s', target: 80 },
    { duration: '1m', target: 200 },
    { duration: '2m', target: 400 },
    { duration: '1m', target: 200 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // baseline: p95 < 2000ms
    http_req_failed: ['rate<0.05'], // baseline: error rate < 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4001';
const API_TOKEN = __ENV.API_TOKEN || 'test-token';
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
  'X-Tenant-ID': 'test-tenant-id',
};

const scenarios = [
  () => testSearch(),
  () => testReports(),
  () => testGraphLineage(),
  () => testComplianceOverview(),
  () => testWorkflowsList(),
  () => testTechStandards(),
  () => testAuditLogs(),
];

export default function () {
  scenarios[Math.floor(Math.random() * scenarios.length)]();
  sleep(Math.random() * 2 + 0.5);
}

function testSearch() {
  const res = http.get(`${BASE_URL}/interfaces?search=map`, { headers });
  assertResult(res, 'search');
}

function testReports() {
  const res = http.get(`${BASE_URL}/reports?limit=15`, { headers });
  assertResult(res, 'reports', 2200);
}

function testGraphLineage() {
  const res = http.get(`${BASE_URL}/graph/lineage`, { headers });
  assertResult(res, 'graph/lineage', 2500);
}

function testComplianceOverview() {
  const res = http.get(`${BASE_URL}/tech-standards/compliance/overview`, { headers });
  assertResult(res, 'compliance overview', 2500);
}

function testWorkflowsList() {
  const res = http.get(`${BASE_URL}/workflows`, { headers });
  assertResult(res, 'workflows');
}

function testTechStandards() {
  const res = http.get(`${BASE_URL}/tech-standards`, { headers });
  assertResult(res, 'tech-standards');
}

function testAuditLogs() {
  const res = http.get(`${BASE_URL}/audit-logs?limit=25`, { headers });
  assertResult(res, 'audit-logs');
}

function assertResult(res, label, bounds = 2000) {
  const success = check(res, {
    [`${label} status is 200`]: (r) => r.status < 300,
    [`${label} response < ${bounds}ms`]: (r) => r.timings.duration < bounds,
  });
  errorRate.add(!success);
}

export function handleSummary(data) {
  const m = data.metrics;
  const p95 = m.http_req_duration['p(95)'];
  const failedRate = m.http_req_failed.values.passes / m.http_reqs.values.count;
  return {
    stdout: `
==============================================
Sprint 39 Load - Final Hardening Regression
==============================================
Duration: ${data.state.testDurationMs / 1000}s
Requests: ${m.http_reqs.values.count}
Failed: ${m.http_req_failed.values.passes}
HTTP avg: ${m.http_req_duration.values.avg.toFixed(2)}ms
HTTP p95: ${p95.toFixed(2)}ms
HTTP max: ${m.http_req_duration.values.max.toFixed(2)}ms
Error rate: ${(failedRate * 100).toFixed(2)}%

SLA vs Sprint 32 baseline:
  p95 < 2000ms: ${p95 < 2000 ? 'PASS' : 'FAIL'}
  error < 5%:   ${failedRate < 0.05 ? 'PASS' : 'FAIL'}
===========================================
      `.trim(),
    'tests/load/summary-sprint39.json': JSON.stringify(data),
  };
}