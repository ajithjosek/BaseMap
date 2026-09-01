/**
 * Generic Prisma client mock with fluent chain API.
 * Every model gets findMany, findUnique, findFirst, create, update, delete, deleteMany, count, upsert.
 */
export function createPrismaMock() {
  const mock = {
    tenant: createModelMock(),
    user: createModelMock(),
    application: createModelMock(),
    applicationCost: createModelMock(),
    capabilityNode: createModelMock(),
    capabilityGap: createModelMock(),
    applicationCapability: createModelMock(),
    interface_: createModelMock(),
    interfaceIncident: createModelMock(),
    technologyComponent: createModelMock(),
    saasApplication: createModelMock(),
    saasRequest: createModelMock(),
    role: createModelMock(),
    permission: createModelMock(),
    userRole: createModelMock(),
    rolePermission: createModelMock(),
    auditLog: createModelMock(),
    comment: createModelMock(),
    notification: createModelMock(),
    workflow: createModelMock(),
    workflowStep: createModelMock(),
    complianceFramework: createModelMock(),
    complianceControl: createModelMock(),
    techStandard: createModelMock(),
    c4Diagram: createModelMock(),
    customReport: createModelMock(),
    insight: createModelMock(),
    importJob: createModelMock(),
    exportJob: createModelMock(),
    webhookConfig: createModelMock(),
    resourceAllocation: createModelMock(),
    transformationProject: createModelMock(),
    aiRecommendation: createModelMock(),
    dashboardWidget: createModelMock(),
    budgetForecast: createModelMock(),
    securityAssessment: createModelMock(),
    accessCertification: createModelMock(),
    retentionPolicy: createModelMock(),
    emailLog: createModelMock(),
    queryHistory: createModelMock(),
    serviceNowConfig: createModelMock(),
    serviceNowSyncLog: createModelMock(),
    exportTemplate: createModelMock(),
    scheduledExport: createModelMock(),
    capabilityKpi: createModelMock(),
    capabilityKpiValue: createModelMock(),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn((fns: any[]) => {
      if (Array.isArray(fns)) {
        return Promise.all(fns);
      }
      return fns;
    }),
  } as any;

  // Alias: many Prisma calls use `this.db.interface` but the model name is `interface_`
  mock.interface = mock.interface_;

  return mock;
}

function createModelMock() {
  const findMany = jest.fn().mockResolvedValue([]);
  const findUnique = jest.fn().mockResolvedValue(null);
  const findFirst = jest.fn().mockResolvedValue(null);
  const create = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'mock-id', ...data }));
  const update = jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where?.id ?? 'mock-id', ...data }));
  const delete_ = jest.fn().mockImplementation(({ where }) => Promise.resolve({ id: where?.id ?? 'mock-id' }));
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const updateMany = jest.fn().mockResolvedValue({ count: 0 });
  const count = jest.fn().mockResolvedValue(0);
  const upsert = jest.fn().mockImplementation(({ create: c }) => Promise.resolve({ id: 'mock-id', ...c }));

  return {
    findMany,
    findUnique,
    findFirst,
    create,
    update,
    delete: delete_,
    deleteMany,
    updateMany,
    count,
    upsert,
    _reset() {
      findMany.mockReset().mockResolvedValue([]);
      findUnique.mockReset().mockResolvedValue(null);
      findFirst.mockReset().mockResolvedValue(null);
      create.mockReset().mockImplementation(({ data }: any) => Promise.resolve({ id: 'mock-id', ...data }));
      update.mockReset().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where?.id ?? 'mock-id', ...data }));
      delete_.mockReset().mockImplementation(({ where }: any) => Promise.resolve({ id: where?.id ?? 'mock-id' }));
      deleteMany.mockReset().mockResolvedValue({ count: 0 });
      updateMany.mockReset().mockResolvedValue({ count: 0 });
      count.mockReset().mockResolvedValue(0);
      upsert.mockReset().mockImplementation(({ create: c }: any) => Promise.resolve({ id: 'mock-id', ...c }));
    },
  };
}
