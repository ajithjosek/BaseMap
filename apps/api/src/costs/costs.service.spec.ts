import { Test, TestingModule } from '@nestjs/testing';
import { CostsService } from './costs.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';
import { makeCost, UUID } from '../../test/__fixtures__/fixtures';

describe('CostsService', () => {
  let service: CostsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CostsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CostsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a cost record', async () => {
      const dto = { amount: 5000, currency: 'USD', cost_type: 'License', application_id: UUID.APP, effective_date: new Date() };
      const expected = makeCost({ amount: 5000 });
      prisma.applicationCost.create.mockResolvedValue(expected);

      const result = await service.create(UUID.TENANT, dto as any, UUID.USER);

      expect(result.amount).toBe(5000);
      expect(prisma.applicationCost.create).toHaveBeenCalled();
    });
  });

  describe('findAllByApplication', () => {
    it('should return costs for an application', async () => {
      const costs = [makeCost(), makeCost({ id: 'cost-2', amount: 2000 })];
      prisma.applicationCost.findMany.mockResolvedValue(costs);

      const result = await service.findAllByApplication(UUID.APP);

      expect(result).toHaveLength(2);
      expect(prisma.applicationCost.findMany).toHaveBeenCalledWith({
        where: { application_id: UUID.APP },
        orderBy: { effective_date: 'desc' },
      });
    });
  });

  describe('getTCO', () => {
    it('should calculate total cost of ownership', async () => {
      const costs = [
        makeCost({ amount: 5000, currency: 'USD' }),
        makeCost({ id: 'cost-2', amount: 3000, currency: 'USD' }),
        makeCost({ id: 'cost-3', amount: 2000, currency: 'USD' }),
      ];
      prisma.applicationCost.findMany.mockResolvedValue(costs);

      const result = await service.getTCO(UUID.APP);

      expect(result.total_annual_cost).toBe(10000);
      expect(result.currency).toBe('USD');
      expect(result.cost_count).toBe(3);
    });

    it('should return zero for no costs', async () => {
      prisma.applicationCost.findMany.mockResolvedValue([]);

      const result = await service.getTCO(UUID.APP);

      expect(result.total_annual_cost).toBe(0);
      expect(result.cost_count).toBe(0);
    });
  });

  describe('remove', () => {
    it('should delete a cost record', async () => {
      prisma.applicationCost.delete.mockResolvedValue(makeCost());

      const result = await service.remove(UUID.COST);

      expect(result).toBeDefined();
      expect(prisma.applicationCost.delete).toHaveBeenCalledWith({
        where: { id: UUID.COST },
      });
    });
  });
});
