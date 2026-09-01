import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CapabilitiesController } from '../src/capabilities/capabilities.controller';
import { CapabilitiesService } from '../src/capabilities/capabilities.service';
import { GapsController } from '../src/capabilities/gaps.controller';
import { GapsService } from '../src/capabilities/gaps.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { MockJwtAuthGuard } from './__mocks__/jwt-auth.guard';
import { createPrismaMock } from './__mocks__/prisma.mock';
import { makeCapabilityNode, UUID } from './__fixtures__/fixtures';

describe('Capabilities E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeAll(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GapsController, CapabilitiesController],
      providers: [
        CapabilitiesService,
        GapsService,
        { provide: PrismaService, useValue: prisma },
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
    prisma.capabilityNode.findMany.mockReset().mockResolvedValue([]);
    prisma.capabilityNode.findUnique.mockReset().mockResolvedValue(null);
    prisma.capabilityNode.findFirst.mockReset().mockResolvedValue(null);
    prisma.capabilityNode.create.mockReset().mockImplementation(({ data }: any) => Promise.resolve({ id: UUID.CAP, ...data }));
    prisma.capabilityNode.update.mockReset().mockImplementation(({ where, data }: any) => Promise.resolve({ id: where?.id, ...data }));
    prisma.capabilityNode.deleteMany.mockReset().mockResolvedValue({ count: 0 });
    prisma.capabilityNode.count.mockReset().mockResolvedValue(0);
    prisma.applicationCapability.findMany.mockReset().mockResolvedValue([]);
    prisma.applicationCapability.upsert.mockReset().mockImplementation(({ create: c }: any) => Promise.resolve({ id: 'ac-1', ...c }));
    prisma.applicationCapability.delete.mockReset().mockResolvedValue({} as any);
    prisma.auditLog.create.mockReset().mockResolvedValue({} as any);
    prisma.application.findMany.mockReset().mockResolvedValue([]);
  });

  describe('GET /capabilities', () => {
    it('should return 200 with capabilities', async () => {
      const caps = [makeCapabilityNode(), makeCapabilityNode({ id: 'cap-2', name: 'Cap 2' })];
      prisma.capabilityNode.findMany.mockResolvedValue(caps);

      const res = await request(app.getHttpServer())
        .get('/capabilities')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('GET /capabilities/gaps', () => {
    it('should return 200 with gaps', async () => {
      prisma.capabilityNode.findMany.mockResolvedValue([]);
      prisma.capabilityGap.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/capabilities/gaps')
        .expect(200);
    });
  });

  describe('POST /capabilities', () => {
    it('should return 201 with created capability', async () => {
      const res = await request(app.getHttpServer())
        .post('/capabilities')
        .set('x-tenant-id', UUID.TENANT)
        .send({ name: 'New Capability', description: 'A new cap', level: 1 })
        .expect(201);

      expect(res.body.name).toBe('New Capability');
    });
  });

  describe('GET /capabilities/:id', () => {
    it('should return 200 with capability', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(makeCapabilityNode());

      const res = await request(app.getHttpServer())
        .get(`/capabilities/${UUID.CAP}`)
        .expect(200);

      expect(res.body.id).toBe(UUID.CAP);
    });

    it('should return 404 when not found', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/capabilities/nonexistent')
        .expect(404);
    });
  });

  describe('PATCH /capabilities/:id', () => {
    it('should return 200 with updated capability', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(makeCapabilityNode());
      prisma.capabilityNode.update.mockResolvedValue(makeCapabilityNode({ name: 'Updated' }));

      const res = await request(app.getHttpServer())
        .patch(`/capabilities/${UUID.CAP}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(res.body.name).toBe('Updated');
    });
  });

  describe('DELETE /capabilities/:id', () => {
    it('should return 200 on successful delete', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(makeCapabilityNode());
      prisma.capabilityNode.findMany.mockResolvedValue([]);
      prisma.capabilityNode.deleteMany.mockResolvedValue({ count: 1 });

      const res = await request(app.getHttpServer())
        .delete(`/capabilities/${UUID.CAP}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /capabilities/:id/map', () => {
    it('should return 201 when mapping application', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(makeCapabilityNode());

      const res = await request(app.getHttpServer())
        .post(`/capabilities/${UUID.CAP}/map`)
        .set('x-tenant-id', UUID.TENANT)
        .send({ application_id: UUID.APP, support_level: 'Primary' })
        .expect(201);

      expect(res.body.application_id).toBe(UUID.APP);
    });
  });

  describe('GET /capabilities/c2a-matrix', () => {
    it('should return 200 with matrix data', async () => {
      prisma.application.findMany.mockResolvedValue([]);
      prisma.capabilityNode.findMany.mockResolvedValue([]);
      prisma.applicationCapability.findMany.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/capabilities/c2a-matrix')
        .expect(200);
    });
  });
});
