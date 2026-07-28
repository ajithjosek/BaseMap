import { Resolver, Query, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { Application } from '../models/application.model';
import { PrismaService } from '../../prisma/prisma.service';

const pubSub = new PubSub();

@Resolver(() => Application)
export class ApplicationResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [Application])
  async applications(@Args('tenant_id') tenantId: string) {
    return this.prisma.application.findMany({
      where: { tenant_id: tenantId, deleted_at: null },
    });
  }

  @Query(() => Application, { nullable: true })
  async application(@Args('id') id: string) {
    return this.prisma.application.findUnique({
      where: { id },
    });
  }

  @Subscription(() => Application)
  applicationAdded() {
    return pubSub.asyncIterableIterator('applicationAdded');
  }
}

export { pubSub };
