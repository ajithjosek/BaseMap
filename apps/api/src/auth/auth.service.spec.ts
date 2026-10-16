import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';
import {
  makeUser,
  makeTenant,
  makeUserRole,
  UUID,
} from '../../test/__fixtures__/fixtures';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwtService: JwtService;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      tenantId: UUID.TENANT,
    };

    it('should register a new user with UUID tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(
        makeUser({ id: UUID.USER, email: registerDto.email }),
      );
      prisma.userRole.findMany.mockResolvedValue([]);
      prisma.tenant.findUnique.mockResolvedValue(makeTenant());

      const result = await service.register(registerDto);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should resolve slug tenant to UUID', async () => {
      const slugTenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(slugTenant);
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(makeUser());
      prisma.userRole.findMany.mockResolvedValue([]);

      await service.register({ ...registerDto, tenantId: 'test-tenant' });

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenant_id: slugTenant.id }),
        }),
      );
    });

    it('should throw NotFoundException for invalid slug tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.register({ ...registerDto, tenantId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate user', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(makeUser());

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user object on valid credentials', async () => {
      const user = makeUser();
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        user.email,
        'password',
        UUID.TENANT,
      );

      expect(result).toBeDefined();
      expect(result.email).toBe(user.email);
      expect(result).not.toHaveProperty('password_hash');
    });

    it('should return null on invalid password', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(makeUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrong',
        UUID.TENANT,
      );

      expect(result).toBeNull();
    });

    it('should throw NotFoundException for unknown user', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.validateUser('unknown@example.com', 'pass', UUID.TENANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should resolve slug tenant before lookup', async () => {
      const slugTenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(slugTenant);
      prisma.user.findUnique.mockResolvedValue(
        makeUser({ tenant_id: slugTenant.id }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateUser('test@example.com', 'password', 'test-tenant');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
      });
    });
  });

  describe('login', () => {
    it('should return access_token, refresh_token, and user with roles', async () => {
      const user = makeUser();
      prisma.userRole.findMany.mockResolvedValue([makeUserRole()]);

      const result = await service.login(user);

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.refresh_token).toBe('mock-jwt-token');
      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.user.roles).toEqual(['admin']);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should return empty roles when user has no roles', async () => {
      const user = makeUser();
      prisma.userRole.findMany.mockResolvedValue([]);

      const result = await service.login(user);

      expect(result.user.roles).toEqual([]);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens on valid refresh token', async () => {
      const user = makeUser();
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: user.id,
        email: user.email,
        tenantId: UUID.TENANT,
      });
      prisma.user.findUnique.mockResolvedValue(user);
      prisma.userRole.findMany.mockResolvedValue([]);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.access_token).toBe('mock-jwt-token');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
      });
    });

    it('should throw UnauthorizedException on invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 'nonexistent-id',
      });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken('valid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
