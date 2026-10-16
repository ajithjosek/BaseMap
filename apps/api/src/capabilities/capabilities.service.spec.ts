import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CapabilitiesService } from './capabilities.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../../test/__mocks__/prisma.mock';
import { makeCapabilityNode, UUID } from '../../test/__fixtures__/fixtures';

describe('CapabilitiesService', () => {
  let service: CapabilitiesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CapabilitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CapabilitiesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a capability at level 1 when no parent', async () => {
      const dto = { name: 'New Cap', description: 'desc' };
      const expected = makeCapabilityNode({ name: 'New Cap', level: 1 });
      prisma.capabilityNode.create.mockResolvedValue(expected);

      const result = await service.create(UUID.TENANT, dto as any);

      expect(result.level).toBe(1);
      expect(prisma.capabilityNode.create).toHaveBeenCalled();
    });

    it('should set level 2 when parent is level 1', async () => {
      const parent = makeCapabilityNode({ id: 'parent-id', level: 1 });
      prisma.capabilityNode.findUnique.mockResolvedValue(parent);
      prisma.capabilityNode.create.mockResolvedValue(
        makeCapabilityNode({ level: 2 }),
      );

      const result = await service.create(UUID.TENANT, {
        name: 'Child',
        parent_id: 'parent-id',
      } as any);

      expect(result.level).toBe(2);
    });

    it('should throw BadRequestException when parent not found', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(null);

      await expect(
        service.create(UUID.TENANT, {
          name: 'X',
          parent_id: 'nonexistent',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all capabilities ordered by level then name', async () => {
      const caps = [
        makeCapabilityNode({ name: 'B Cap', level: 2 }),
        makeCapabilityNode({ id: 'cap-2', name: 'A Cap', level: 1 }),
      ];
      prisma.capabilityNode.findMany.mockResolvedValue(caps);

      const result = await service.findAll(UUID.TENANT);

      expect(result).toHaveLength(2);
      expect(prisma.capabilityNode.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ level: 'asc' }, { name: 'asc' }],
        }),
      );
    });
  });

  describe('getTree', () => {
    it('should build tree structure from flat list', async () => {
      const root = makeCapabilityNode({ id: 'root', parent_id: null });
      const child = makeCapabilityNode({
        id: 'child',
        parent_id: 'root',
        level: 2,
      });
      prisma.capabilityNode.findMany.mockResolvedValue([root, child]);

      const result = await service.getTree(UUID.TENANT);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('root');
      expect(result[0].children).toHaveLength(1);
      expect(result[0].children[0].id).toBe('child');
    });

    it('should handle orphaned nodes as roots', async () => {
      const orphan = makeCapabilityNode({
        id: 'orphan',
        parent_id: 'nonexistent',
      });
      prisma.capabilityNode.findMany.mockResolvedValue([orphan]);

      const result = await service.getTree(UUID.TENANT);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('orphan');
    });
  });

  describe('findOne', () => {
    it('should return capability with relations', async () => {
      const cap = makeCapabilityNode();
      prisma.capabilityNode.findUnique.mockResolvedValue(cap);

      const result = await service.findOne(UUID.CAP);

      expect(result.id).toBe(UUID.CAP);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update an existing capability', async () => {
      const existing = makeCapabilityNode();
      prisma.capabilityNode.findUnique.mockResolvedValue(existing);
      prisma.capabilityNode.update.mockResolvedValue({
        ...existing,
        name: 'Updated',
      });

      const result = await service.update(
        UUID.CAP,
        { name: 'Updated' },
        UUID.TENANT,
      );

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', {} as any, UUID.TENANT),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when capability is locked', async () => {
      const locked = makeCapabilityNode({ is_locked: true });
      prisma.capabilityNode.findUnique.mockResolvedValue(locked);

      await expect(
        service.update(UUID.CAP, { name: 'Change' } as any, UUID.TENANT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow unlocking a locked capability', async () => {
      const locked = makeCapabilityNode({ is_locked: true });
      prisma.capabilityNode.findUnique.mockResolvedValue(locked);
      prisma.capabilityNode.update.mockResolvedValue({
        ...locked,
        is_locked: false,
      });

      const result = await service.update(
        UUID.CAP,
        { is_locked: false },
        UUID.TENANT,
      );

      expect(result.is_locked).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete a capability and its descendants', async () => {
      const cap = makeCapabilityNode();
      prisma.capabilityNode.findUnique.mockResolvedValue(cap);
      prisma.capabilityNode.findMany.mockResolvedValue([]);
      prisma.capabilityNode.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.remove(UUID.CAP, UUID.TENANT);

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
    });

    it('should throw NotFoundException when not found', async () => {
      prisma.capabilityNode.findUnique.mockResolvedValue(null);

      await expect(service.remove('nonexistent', UUID.TENANT)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when locked', async () => {
      const locked = makeCapabilityNode({ is_locked: true });
      prisma.capabilityNode.findUnique.mockResolvedValue(locked);

      await expect(service.remove(UUID.CAP, UUID.TENANT)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should cascade delete descendants', async () => {
      const cap = makeCapabilityNode();
      const child = makeCapabilityNode({ id: 'child-1', parent_id: UUID.CAP });
      prisma.capabilityNode.findUnique.mockResolvedValue(cap);
      prisma.capabilityNode.findMany
        .mockResolvedValueOnce([child])
        .mockResolvedValueOnce([]);
      prisma.capabilityNode.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.remove(UUID.CAP, UUID.TENANT);

      expect(result.count).toBe(2);
    });
  });

  describe('getC2AMatrix', () => {
    it('should return applications, capabilities, and mapping matrix', async () => {
      const apps = [{ id: 'app-1', name: 'App 1' }];
      const caps = [{ id: 'cap-1', name: 'Cap 1' }];
      const mappings = [
        {
          application_id: 'app-1',
          capability_id: 'cap-1',
          support_level: 'Full',
        },
      ];

      prisma.application.findMany.mockResolvedValue(apps as any);
      prisma.capabilityNode.findMany.mockResolvedValue(caps as any);
      prisma.applicationCapability.findMany.mockResolvedValue(mappings as any);

      const result = await service.getC2AMatrix(UUID.TENANT);

      expect(result.applications).toHaveLength(1);
      expect(result.capabilities).toHaveLength(1);
      expect(result.matrix['app-1']['cap-1']).toBe('Full');
    });
  });

  describe('getCapabilityCoverage', () => {
    it('should mark capabilities as red when no apps mapped', async () => {
      const caps = [
        makeCapabilityNode({ _count: { applications: 0 }, children: [] }),
      ];
      prisma.capabilityNode.findMany.mockResolvedValue(caps as any);

      const result = await service.getCapabilityCoverage(UUID.TENANT);

      expect(result[UUID.CAP].status).toBe('red');
      expect(result[UUID.CAP].appCount).toBe(0);
    });

    it('should mark capabilities as green when directly mapped', async () => {
      const caps = [
        makeCapabilityNode({ _count: { applications: 2 }, children: [] }),
      ];
      prisma.capabilityNode.findMany.mockResolvedValue(caps as any);

      const result = await service.getCapabilityCoverage(UUID.TENANT);

      expect(result[UUID.CAP].status).toBe('green');
      expect(result[UUID.CAP].appCount).toBe(2);
    });

    it('should mark capabilities as yellow when only children mapped', async () => {
      const caps = [
        makeCapabilityNode({
          _count: { applications: 0 },
          children: [{ _count: { applications: 1 } }],
        }),
      ];
      prisma.capabilityNode.findMany.mockResolvedValue(caps as any);

      const result = await service.getCapabilityCoverage(UUID.TENANT);

      expect(result[UUID.CAP].status).toBe('yellow');
      expect(result[UUID.CAP].appCount).toBe(1);
    });
  });
});
