import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { SsoService } from '../src/auth/sso.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { createPrismaMock } from './__mocks__/prisma.mock';
import { makeUser, UUID } from './__fixtures__/fixtures';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwtService: JwtService;

  beforeAll(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '15m' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        SsoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    jwtService = app.get(JwtService);
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    prisma.tenant.findUnique.mockReset().mockResolvedValue(null);
    prisma.user.findUnique.mockReset().mockResolvedValue(null);
    prisma.user.create
      .mockReset()
      .mockImplementation(({ data }: any) =>
        Promise.resolve({ id: UUID.USER, ...data }),
      );
    prisma.userRole.findMany.mockReset().mockResolvedValue([]);
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockReset();
  });

  describe('POST /auth/login', () => {
    it('should return 201 with access_token on valid credentials', async () => {
      const user = makeUser();
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', UUID.TENANT)
        .send({ email: user.email, password: 'password' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(user.email);
    });

    it('should return 401 on invalid credentials', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', UUID.TENANT)
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);
    });

    it('should return 401 when tenant ID is missing', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'pass' })
        .expect(401);
    });

    it('should return 401 when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', UUID.TENANT)
        .send({ email: 'unknown@example.com', password: 'pass' })
        .expect(401);
    });
  });

  describe('POST /auth/register', () => {
    it('should return 201 with tokens on successful registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'new@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
          tenantId: UUID.TENANT,
        })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.user.email).toBe('new@example.com');
    });

    it('should return 409 on duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          tenantId: UUID.TENANT,
        })
        .expect(409);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 201 with new tokens on valid refresh token', async () => {
      jest.spyOn(jwtService, 'verify').mockReturnValue({
        sub: UUID.USER,
        email: 'test@example.com',
        tenantId: UUID.TENANT,
      });
      prisma.user.findUnique.mockResolvedValue(makeUser());

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'valid-token' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
    });

    it('should return 401 on invalid refresh token', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('invalid');
      });

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid' })
        .expect(401);
    });
  });
});
