import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';
import { makeInterface, UUID } from '../../test/__fixtures__/fixtures';

describe('InterfacesService', () => {
  let service: InterfacesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterfacesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(InterfacesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create an interface', async () => {
      const dto = { name: 'New Interface', interface_type: 'REST API' as const, status: 'Operational' as const };
      const expected = makeInterface({ name: 'New Interface' });
      prisma.interface.create.mockResolvedValue(expected);

      const result = await service.create(UUID.TENANT, dto, UUID.USER);

      expect(result.name).toBe('New Interface');
      expect(prisma.interface.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all interfaces for tenant', async () => {
      const ifaces = [makeInterface(), makeInterface({ id: 'iface-2', name: 'Interface 2' })];
      prisma.interface.findMany.mockResolvedValue(ifaces);

      const result = await service.findAll(UUID.TENANT);

      expect(result).toHaveLength(2);
    });

    it('should apply search filter', async () => {
      prisma.interface.findMany.mockResolvedValue([]);

      await service.findAll(UUID.TENANT, { search: 'test' });

      expect(prisma.interface.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'test' }) }),
            ]),
          }),
        }),
      );
    });

    it('should apply status filter', async () => {
      prisma.interface.findMany.mockResolvedValue([]);

      await service.findAll(UUID.TENANT, { status: 'Down' });

      expect(prisma.interface.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'Down' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return interface by id', async () => {
      prisma.interface.findUnique.mockResolvedValue(makeInterface());

      const result = await service.findOne(UUID.IFACE);

      expect(result.id).toBe(UUID.IFACE);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.interface.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an interface', async () => {
      prisma.interface.findUnique.mockResolvedValue(makeInterface());
      prisma.interface.update.mockResolvedValue(makeInterface({ name: 'Updated' }));

      const result = await service.update(UUID.IFACE, UUID.TENANT, { name: 'Updated' } as any);

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.interface.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', UUID.TENANT, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an interface', async () => {
      prisma.interface.findUnique.mockResolvedValue(makeInterface());
      prisma.interface.delete.mockResolvedValue(makeInterface());

      const result = await service.remove(UUID.IFACE, UUID.TENANT);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.interface.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', UUID.TENANT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return interface statistics', async () => {
      prisma.interface.count
        .mockResolvedValueOnce(10)  // total
        .mockResolvedValueOnce(7)   // operational
        .mockResolvedValueOnce(2)   // degraded
        .mockResolvedValueOnce(1);  // down
      prisma.interfaceIncident.count.mockResolvedValue(3);

      const result = await service.getStats(UUID.TENANT);

      expect(result.total).toBe(10);
      expect(result.operational).toBe(7);
      expect(result.degraded).toBe(2);
      expect(result.down).toBe(1);
      expect(result.open_incidents).toBe(3);
    });
  });

  describe('resolveIncident', () => {
    it('should resolve an incident with notes', async () => {
      const incident = { id: 'inc-1', status: 'Open' };
      prisma.interfaceIncident.findUnique.mockResolvedValue(incident as any);
      prisma.interfaceIncident.update.mockResolvedValue({ ...incident, status: 'Resolved' } as any);

      const result = await service.resolveIncident('inc-1', UUID.TENANT, 'Fixed the issue');

      expect(prisma.interfaceIncident.update).toHaveBeenCalledWith({
        where: { id: 'inc-1' },
        data: expect.objectContaining({
          status: 'Resolved',
          resolution_notes: 'Fixed the issue',
        }),
      });
    });

    it('should throw NotFoundException when incident not found', async () => {
      prisma.interfaceIncident.findUnique.mockResolvedValue(null);

      await expect(
        service.resolveIncident('nonexistent', UUID.TENANT, 'notes'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
