import { Resolver, Query, Args } from '@nestjs/graphql';
import { Capability } from '../models/capability.model';
import { PrismaService } from '../../prisma/prisma.service';

@Resolver(() => Capability)
export class CapabilityResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [Capability])
  async capabilities(@Args('tenant_id') tenantId: string) {
    return this.prisma.capabilityNode.findMany({
      where: { tenant_id: tenantId },
    });
  }
}
