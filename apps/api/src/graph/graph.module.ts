import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { PrismaModule } from '../prisma/prisma.module';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [PrismaModule, Neo4jModule],
  controllers: [GraphController],
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
