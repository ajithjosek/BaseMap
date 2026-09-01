export function makeTenant(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Tenant',
    slug: 'test-tenant',
    settings: {},
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeUser(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    password_hash: '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012',
    first_name: 'Test',
    last_name: 'User',
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    sso_provider: null,
    sso_subject: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeApplication(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440010',
    name: 'Test Application',
    description: 'A test application',
    vendor: 'TestVendor',
    lifecycle_state: 'Active',
    lifecycle_changed_at: null,
    lifecycle_changed_by: null,
    lifecycle_reason: null,
    technology_type: 'Web Application',
    risk_score: 5,
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    business_unit_id: null,
    owner_id: null,
    deleted_at: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeCapabilityNode(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440020',
    name: 'Test Capability',
    description: 'A test capability',
    level: 1,
    parent_id: null,
    strategic_importance: 'High',
    is_locked: false,
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeInterface(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440030',
    name: 'Test Interface',
    description: 'A test interface',
    interface_type: 'REST API',
    status: 'Operational',
    source_application_id: null,
    target_application_id: null,
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    created_by: null,
    owner_id: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeCost(overrides: Record<string, any> = {}) {
  return {
    id: '550e8400-e29b-41d4-a716-446655440040',
    application_id: '550e8400-e29b-41d4-a716-446655440010',
    amount: 10000,
    currency: 'USD',
    cost_type: 'License',
    effective_date: new Date('2026-01-01'),
    tenant_id: '550e8400-e29b-41d4-a716-446655440000',
    created_by: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

export function makeUserRole(overrides: Record<string, any> = {}) {
  return {
    user_id: '550e8400-e29b-41d4-a716-446655440001',
    role_id: '550e8400-e29b-41d4-a716-446655440050',
    business_unit_id: '550e8400-e29b-41d4-a716-446655440000',
    role: { name: 'admin' },
    ...overrides,
  };
}

export const UUID = {
  TENANT: '550e8400-e29b-41d4-a716-446655440000',
  USER: '550e8400-e29b-41d4-a716-446655440001',
  APP: '550e8400-e29b-41d4-a716-446655440010',
  CAP: '550e8400-e29b-41d4-a716-446655440020',
  IFACE: '550e8400-e29b-41d4-a716-446655440030',
  COST: '550e8400-e29b-41d4-a716-446655440040',
  ROLE: '550e8400-e29b-41d4-a716-446655440050',
};
