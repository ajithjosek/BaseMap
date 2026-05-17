import { Controller, Post, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { GraphService } from './graph.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('graph')
@UseGuards(JwtAuthGuard)
export class GraphController {
  constructor(private readonly graphService: GraphService) {}

  @Post('sync')
  async syncToGraph(@Req() req: any) {
    return this.graphService.syncPostgresToNeo4j(req.tenantId);
  }

  @Get('lineage/:appId')
  async getLineage(
    @Req() req: any,
    @Param('appId') appId: string,
    @Query('hops') hops?: string,
  ) {
    const depth = hops ? parseInt(hops, 10) : 3;
    return this.graphService.getMultiHopLineage(req.tenantId, appId, depth);
  }

  @Get('impact/:appId')
  async getImpactAnalysis(
    @Req() req: any,
    @Param('appId') appId: string,
  ) {
    return this.graphService.getImpactAnalysis(req.tenantId, appId);
  }

  @Get('circular-dependencies')
  async getCircularDependencies(@Req() req: any) {
    return this.graphService.detectCircularDependencies(req.tenantId);
  }

  @Get('export')
  async exportGraph(@Req() req: any) {
    return this.graphService.exportGraph(req.tenantId);
  }
}
