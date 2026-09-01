import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SsoService } from './sso.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';
import { makeTenant, UUID } from '../../test/__fixtures__/fixtures';

describe('SsoService', () => {
  let service: SsoService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SsoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(SsoService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('resolveSso', () => {
    it('should return SSO config when tenant has SSO enabled', async () => {
      const tenant = makeTenant({
        settings: {
          sso: {
            enabled: true,
            provider: 'oidc',
            issuer: 'https://idp.example.com',
            clientId: 'my-client',
            clientSecret: 'secret',
          },
        },
      });
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      const result = await service.resolveSso(UUID.TENANT);

      expect(result).toBeDefined();
      expect(result?.enabled).toBe(true);
      expect(result?.provider).toBe('oidc');
    });

    it('should resolve tenant by slug', async () => {
      const tenant = makeTenant({
        settings: { sso: { enabled: true, provider: 'oidc' } },
      });
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      await service.resolveSso('test-tenant');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-tenant' },
      });
    });

    it('should resolve tenant by UUID', async () => {
      const tenant = makeTenant({
        settings: { sso: { enabled: true, provider: 'oidc' } },
      });
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      await service.resolveSso(UUID.TENANT);

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: UUID.TENANT },
      });
    });

    it('should return null when tenant not found', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      const result = await service.resolveSso('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null when SSO not configured', async () => {
      prisma.tenant.findUnique.mockResolvedValue(makeTenant({ settings: {} }));

      const result = await service.resolveSso(UUID.TENANT);

      expect(result).toBeNull();
    });

    it('should return null when SSO disabled', async () => {
      prisma.tenant.findUnique.mockResolvedValue(
        makeTenant({ settings: { sso: { enabled: false } } }),
      );

      const result = await service.resolveSso(UUID.TENANT);

      expect(result).toBeNull();
    });
  });

  describe('buildOidcConfig', () => {
    it('should return valid OIDC config', async () => {
      const tenant = makeTenant({
        settings: {
          sso: {
            enabled: true,
            provider: 'oidc',
            issuer: 'https://idp.example.com',
            clientId: 'my-client',
            clientSecret: 'my-secret',
          },
        },
      });
      prisma.tenant.findUnique.mockResolvedValue(tenant);

      const result = await service.buildOidcConfig(UUID.TENANT);

      expect(result.provider).toBe('oidc');
      expect(result.issuer).toBe('https://idp.example.com');
    });

    it('should throw BadRequestException when SSO not configured', async () => {
      prisma.tenant.findUnique.mockResolvedValue(makeTenant({ settings: {} }));

      await expect(service.buildOidcConfig(UUID.TENANT)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid OIDC config (missing issuer)', async () => {
      prisma.tenant.findUnique.mockResolvedValue(
        makeTenant({
          settings: {
            sso: {
              enabled: true,
              provider: 'oidc',
              clientId: 'my-client',
              clientSecret: 'my-secret',
            },
          },
        }),
      );

      await expect(service.buildOidcConfig(UUID.TENANT)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for non-OIDC provider', async () => {
      prisma.tenant.findUnique.mockResolvedValue(
        makeTenant({
          settings: {
            sso: {
              enabled: true,
              provider: 'saml',
              issuer: 'https://idp.example.com',
              clientId: 'x',
              clientSecret: 'x',
            },
          },
        }),
      );

      await expect(service.buildOidcConfig(UUID.TENANT)).rejects.toThrow(BadRequestException);
    });
  });

  describe('provisionSsoUser', () => {
    it('should return existing user when found', async () => {
      const existingUser = { id: UUID.USER, email: 'sso@example.com', sso_provider: null, sso_subject: null };
      const tenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.user.findUnique.mockResolvedValue(existingUser as any);

      const result = await service.provisionSsoUser('sso@example.com', 'oidc', UUID.TENANT, 'SSO', 'User');

      expect(result.id).toBe(UUID.USER);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should update SSO fields on existing user', async () => {
      const existingUser = { id: UUID.USER, email: 'sso@example.com', sso_provider: null, sso_subject: null };
      const tenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.user.findUnique.mockResolvedValue(existingUser as any);
      prisma.user.update.mockResolvedValue({ ...existingUser, sso_provider: 'oidc', sso_subject: 'oidc:sso@example.com' } as any);

      const result = await service.provisionSsoUser('sso@example.com', 'oidc', UUID.TENANT);

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should create new user when not found', async () => {
      const tenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: UUID.USER, email: 'sso@example.com' } as any);

      const result = await service.provisionSsoUser('sso@example.com', 'oidc', UUID.TENANT, 'New', 'User');

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe('sso@example.com');
    });

    it('should resolve slug tenant to UUID for user creation', async () => {
      const tenant = makeTenant();
      prisma.tenant.findUnique.mockResolvedValue(tenant);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: UUID.USER, email: 'sso@example.com' } as any);

      await service.provisionSsoUser('sso@example.com', 'oidc', 'test-tenant');

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenant_id: tenant.id }),
        }),
      );
    });
  });

  describe('parseSamlResponse', () => {
    it('should extract email from SAML attributes', () => {
      const saml = `<saml2:Response>
        <saml2:Assertion>
          <saml2:AttributeStatement>
            <saml2:Attribute Name="email">
              <saml2:AttributeValue>user@example.com</saml2:AttributeValue>
            </saml2:Attribute>
            <saml2:Attribute Name="givenName">
              <saml2:AttributeValue>John</saml2:AttributeValue>
            </saml2:Attribute>
            <saml2:Attribute Name="sn">
              <saml2:AttributeValue>Doe</saml2:AttributeValue>
            </saml2:Attribute>
          </saml2:AttributeStatement>
        </saml2:Assertion>
      </saml2:Response>`;

      const result = service.parseSamlResponse(saml);

      expect(result.email).toBe('user@example.com');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should extract email from NameID', () => {
      const saml = `<saml2:Response>
        <saml2:Assertion>
          <saml2:Subject>
            <saml2:NameID>nameid@example.com</saml2:NameID>
          </saml2:Subject>
        </saml2:Assertion>
      </saml2:Response>`;

      const result = service.parseSamlResponse(saml);

      expect(result.email).toBe('nameid@example.com');
    });

    it('should decode base64-encoded SAML response', () => {
      const xml = `<saml2:Response><saml2:Assertion><saml2:Subject><saml2:NameID>decoded@example.com</saml2:NameID></saml2:Subject></saml2:Assertion></saml2:Response>`;
      const encoded = Buffer.from(xml).toString('base64');

      const result = service.parseSamlResponse(encoded);

      expect(result.email).toBe('decoded@example.com');
    });

    it('should throw UnauthorizedException when no email found', () => {
      const saml = `<saml2:Response><saml2:Assertion></saml2:Assertion></saml2:Response>`;

      expect(() => service.parseSamlResponse(saml)).toThrow(UnauthorizedException);
    });
  });
});
