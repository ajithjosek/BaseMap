import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ApplicationsController } from '../src/applications/applications.controller';
import { ApplicationsService } from '../src/applications/applications.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { MockJwtAuthGuard } from './__mocks__/jwt-auth.guard';
import { TenantMiddleware } from '../src/common/middleware/tenant.middleware';
import { createPrismaMock } from './__mocks__/prisma.mock';
import { makeApplication, UUID } from './__fixtures__/fixtures';

describe('Applications E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeAll(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicationsController],
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: { sendLifecycleChangeNotification: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.use(
      (req: any, _res: any, next: any) => {
        const tenantId = req.headers['x-tenant-id'];
        if (tenantId) req.tenantId = tenantId;
        next();
      },
    );
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    prisma.application.findMany.mockReset().mockResolvedValue([]);
    prisma.application.findFirst.mockReset().mockResolvedValue(null);
    prisma.application.count.mockReset().mockResolvedValue(0);
    prisma.application.create.mockReset().mockImplementation(({ data }: any) => Promise.resolve({ id: UUID.APP, ...data }));
    prisma.application.update.mockReset().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where?.id, ...data }));
    prisma.application.updateMany.mockReset().mockResolvedValue({ count: 0 });
    prisma.auditLog.create.mockReset().mockResolvedValue({} as any);
  });

  describe('GET /applications', () => {
    it('should return 200 with paginated applications', async () => {
      const apps = [makeApplication(), makeApplication({ id: 'app-2', name: 'App 2' })];
      prisma.application.findMany.mockResolvedValue(apps);
      prisma.application.count.mockResolvedValue(2);

      const res = await request(app.getHttpServer())
        .get('/applications')
        .set('x-tenant-id', UUID.TENANT)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should support search query param', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.application.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/applications?search=test&limit=5')
        .set('x-tenant-id', UUID.TENANT)
        .expect(200);
    });
  });

  describe('POST /applications', () => {
    it('should return 201 with created application', async () => {
      const res = await request(app.getHttpServer())
        .post('/applications')
        .set('x-tenant-id', UUID.TENANT)
        .send({ name: 'New App', description: 'A new app' })
        .expect(201);

      expect(res.body.name).toBe('New App');
    });
  });

  describe('GET /applications/:id', () => {
    it('should return 200 with application', async () => {
      prisma.application.findFirst.mockResolvedValue(makeApplication());

      const res = await request(app.getHttpServer())
        .get(`/applications/${UUID.APP}`)
        .expect(200);

      expect(res.body.id).toBe(UUID.APP);
    });

    it('should return 404 when not found', async () => {
      prisma.application.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/applications/nonexistent')
        .expect(404);
    });
  });

  describe('PATCH /applications/:id', () => {
    it('should return 200 with updated application', async () => {
      prisma.application.findFirst.mockResolvedValue(makeApplication());
      prisma.application.update.mockResolvedValue(makeApplication({ name: 'Updated' }));

      const res = await request(app.getHttpServer())
        .patch(`/applications/${UUID.APP}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /applications/:id', () => {
    it('should return 200 on soft delete', async () => {
      prisma.application.findFirst.mockResolvedValue(makeApplication());
      prisma.application.update.mockResolvedValue(makeApplication({ deleted_at: new Date() }));

      await request(app.getHttpServer())
        .delete(`/applications/${UUID.APP}`)
        .expect(200);
    });
  });

  describe('POST /applications/bulk-delete', () => {
    it('should return 201 and delete multiple', async () => {
      prisma.application.updateMany.mockResolvedValue({ count: 2 });

      const res = await request(app.getHttpServer())
        .post('/applications/bulk-delete')
        .send({ ids: ['app-1', 'app-2'] })
        .expect(201);

      expect(res.body.count).toBe(2);
    });
  });

  describe('POST /applications/:id/transition', () => {
    it('should return 201 on valid lifecycle transition', async () => {
      prisma.application.findFirst.mockResolvedValue(
        makeApplication({ lifecycle_state: 'Planning' }),
      );
      prisma.application.update.mockResolvedValue(
        makeApplication({ lifecycle_state: 'Active' }),
      );

      const res = await request(app.getHttpServer())
        .post(`/applications/${UUID.APP}/transition`)
        .send({ target_state: 'Active', reason: 'Ready' })
        .expect(201);

      expect(res.body.lifecycle_state).toBe('Active');
    });

    it('should return 400 on invalid lifecycle transition', async () => {
      prisma.application.findFirst.mockResolvedValue(
        makeApplication({ lifecycle_state: 'Retired' }),
      );

      await request(app.getHttpServer())
        .post(`/applications/${UUID.APP}/transition`)
        .send({ target_state: 'Active' })
        .expect(400);
    });
  });
});
