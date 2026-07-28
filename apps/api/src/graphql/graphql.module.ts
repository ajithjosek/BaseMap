import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { ApplicationResolver } from './resolvers/application.resolver';
import { CapabilityResolver } from './resolvers/capability.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      subscriptions: {
        'graphql-ws': true,
      },
      playground: true,
    }),
  ],
  providers: [ApplicationResolver, CapabilityResolver],
})
export class AppGraphQLModule {}
