import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';
import { makeApplication, UUID } from '../../test/__fixtures__/fixtures';

describe('ApplicationsService', () => {
  let service: ApplicationsService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let notificationsService: { sendLifecycleChangeNotification: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    notificationsService = {
      sendLifecycleChangeNotification: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(ApplicationsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create an application with tenant_id', async () => {
      const dto = { name: 'New App', description: 'desc' };
      const expected = makeApplication({ name: 'New App' });
      prisma.application.create.mockResolvedValue(expected);

      const result = await service.create(UUID.TENANT, dto);

      expect(prisma.application.create).toHaveBeenCalledWith({
        data: { ...dto, tenant_id: UUID.TENANT },
      });
      expect(result.name).toBe('New App');
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const apps = [
        makeApplication(),
        makeApplication({ id: 'app-2', name: 'App 2' }),
      ];
      prisma.application.findMany.mockResolvedValue(apps);
      prisma.application.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 }, UUID.TENANT);

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should default to page 1, limit 10', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.findAll({}, UUID.TENANT);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it('should apply search filter', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.findAll({ search: 'test' }, UUID.TENANT);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                name: expect.objectContaining({ contains: 'test' }),
              }),
            ]),
          }),
        }),
      );
    });

    it('should apply lifecycle filter', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.findAll(
        { lifecycle: ['Active', 'Maintenance'] },
        UUID.TENANT,
      );

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lifecycle_state: { in: ['Active', 'Maintenance'] },
          }),
        }),
      );
    });

    it('should apply risk range filter', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.findAll({ risk_min: '3', risk_max: '7' }, UUID.TENANT);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            risk_score: { gte: 3, lte: 7 },
          }),
        }),
      );
    });

    it('should apply custom sort', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await service.findAll({ sort: 'risk_score:desc' }, UUID.TENANT);

      expect(prisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ risk_score: 'desc' }],
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return application with relations', async () => {
      const app = makeApplication();
      prisma.application.findFirst.mockResolvedValue(app);

      const result = await service.findOne(UUID.APP);

      expect(result.id).toBe(UUID.APP);
    });

    it('should throw NotFoundException for missing id', async () => {
      prisma.application.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing application', async () => {
      prisma.application.findFirst.mockResolvedValue(makeApplication());
      prisma.application.update.mockResolvedValue(
        makeApplication({ name: 'Updated' }),
      );

      const result = await service.update(UUID.APP, { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.application.findFirst.mockResolvedValue(null);

      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft-delete an application', async () => {
      prisma.application.findFirst.mockResolvedValue(makeApplication());
      prisma.application.update.mockResolvedValue(
        makeApplication({ deleted_at: new Date() }),
      );

      await service.remove(UUID.APP);

      expect(prisma.application.update).toHaveBeenCalledWith({
        where: { id: UUID.APP },
        data: { deleted_at: expect.any(Date) },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.application.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkDelete', () => {
    it('should soft-delete multiple applications', async () => {
      prisma.application.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkDelete(['app-1', 'app-2']);

      expect(result.count).toBe(2);
      expect(prisma.application.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['app-1', 'app-2'] } },
        data: { deleted_at: expect.any(Date) },
      });
    });
  });

  describe('transitionLifecycle', () => {
    it('should allow valid transition (Planning → Active)', async () => {
      const app = makeApplication({ lifecycle_state: 'Planning' });
      prisma.application.findFirst.mockResolvedValue(app);
      prisma.application.update.mockResolvedValue({
        ...app,
        lifecycle_state: 'Active',
      });
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.transitionLifecycle(
        UUID.APP,
        { target_state: 'Active', reason: 'Ready' },
        UUID.USER,
      );

      expect(result.lifecycle_state).toBe('Active');
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(
        notificationsService.sendLifecycleChangeNotification,
      ).toHaveBeenCalled();
    });

    it('should reject invalid transition (Retired → Active)', async () => {
      const app = makeApplication({ lifecycle_state: 'Retired' });
      prisma.application.findFirst.mockResolvedValue(app);

      await expect(
        service.transitionLifecycle(
          UUID.APP,
          { target_state: 'Active' },
          UUID.USER,
        ),
      ).rejects.toThrow('Invalid lifecycle transition');
    });

    it('should allow Retirement → Active transition', async () => {
      const app = makeApplication({ lifecycle_state: 'Retirement' });
      prisma.application.findFirst.mockResolvedValue(app);
      prisma.application.update.mockResolvedValue({
        ...app,
        lifecycle_state: 'Active',
      });
      prisma.auditLog.create.mockResolvedValue({} as any);

      const result = await service.transitionLifecycle(
        UUID.APP,
        { target_state: 'Active', reason: 'Reactivated' },
        UUID.USER,
      );

      expect(result.lifecycle_state).toBe('Active');
    });
  });
});
