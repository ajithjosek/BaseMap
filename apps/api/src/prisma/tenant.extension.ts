import { Prisma } from '@prisma/client';

export const tenantExtension = (tenantId?: string) => {
  return Prisma.defineExtension((client) => {
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            if (!tenantId) {
              return query(args);
            }

            // List of models that have tenant_id
            const modelsWithTenantId = [
              'Organization', 'BusinessUnit', 'Application', 'ApplicationCost',
              'CapabilityNode', 'ApplicationCapability', 'Interface',
              'TechnologyComponent', 'SaaSApplication', 'User', 'Role',
              'AuditLog', 'Comment'
            ];

            if (modelsWithTenantId.includes(model)) {
              if (['findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
                (args as any).where = { ...(args as any).where, tenant_id: tenantId };
              } else if (['update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
                (args as any).where = { ...(args as any).where, tenant_id: tenantId };
              } else if (operation === 'create') {
                (args as any).data = { ...(args as any).data, tenant_id: tenantId };
              }
            }

            return query(args);
          },
        },
      },
    });
  });
};
