import { Test, TestingModule } from '@nestjs/testing';
import { SaaSRequestsService } from './saas-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';

describe('SaaSRequestsService', () => {
  let service: SaaSRequestsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaaSRequestsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SaaSRequestsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('queries the injected Prisma client scoped to the tenant', async () => {
      prisma.saaSRequest.findMany.mockResolvedValue([]);

      await service.findAll('tenant-1', 'user-1');

      expect(prisma.saaSRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenant_id: 'tenant-1' }),
        }),
      );
    });
  });
});
