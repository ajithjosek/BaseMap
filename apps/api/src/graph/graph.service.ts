import { Injectable, Logger } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GraphService {
  private readonly logger = new Logger(GraphService.name);

  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly prismaService: PrismaService,
  ) {}

  async syncPostgresToNeo4j(tenantId: string) {
    this.logger.log(`Starting PostgreSQL to Neo4j sync for tenant: ${tenantId}`);
    
    // Clear existing data for this tenant
    await this.neo4jService.write(
      `MATCH (n {tenantId: $tenantId}) DETACH DELETE n`,
      { tenantId }
    );

    // Sync Applications
    const apps = await this.prismaService.application.findMany({
      where: { tenant_id: tenantId },
    });
    
    for (const app of apps) {
      await this.neo4jService.write(
        `CREATE (a:Application {
          id: $id, 
          tenantId: $tenantId, 
          name: $name, 
          lifecycle: $lifecycle,
          risk: $risk
        })`,
        {
          id: app.id,
          tenantId: tenantId,
          name: app.name,
          lifecycle: app.lifecycle_state,
          risk: app.risk_score,
        }
      );
    }

    // Sync Capabilities
    const capabilities = await this.prismaService.capabilityNode.findMany({
      where: { tenant_id: tenantId },
    });

    for (const cap of capabilities) {
      await this.neo4jService.write(
        `CREATE (c:Capability {
          id: $id,
          tenantId: $tenantId,
          name: $name,
          level: $level
        })`,
        {
          id: cap.id,
          tenantId: tenantId,
          name: cap.name,
          level: cap.level,
        }
      );
    }

    // Link Apps to Capabilities
    const appCaps = await this.prismaService.applicationCapability.findMany({
      where: { tenant_id: tenantId },
    });

    for (const link of appCaps) {
      await this.neo4jService.write(
        `MATCH (a:Application {id: $appId}), (c:Capability {id: $capId})
         MERGE (a)-[:SUPPORTS {level: $level}]->(c)`,
        {
          appId: link.application_id,
          capId: link.capability_id,
          level: link.support_level,
        }
      );
    }

    // Link Interfaces (App to App)
    const interfaces = await this.prismaService.interface.findMany({
      where: { tenant_id: tenantId },
    });

    for (const intf of interfaces) {
      if (intf.source_application_id && intf.target_application_id) {
        await this.neo4jService.write(
          `MATCH (src:Application {id: $srcId}), (tgt:Application {id: $tgtId})
           MERGE (src)-[:SENDS_DATA_TO {
             id: $id, 
             name: $name,
             protocol: $protocol
           }]->(tgt)`,
          {
            srcId: intf.source_application_id,
            tgtId: intf.target_application_id,
            id: intf.id,
            name: intf.name,
            protocol: intf.protocol || 'Unknown',
          }
        );
      }
    }

    this.logger.log(`Completed sync for tenant: ${tenantId}`);
    return { success: true, message: 'Sync completed successfully' };
  }

  async getMultiHopLineage(tenantId: string, appId: string, hops: number = 3) {
    const result = await this.neo4jService.read(
      `MATCH path = (a:Application {id: $appId})-[:SENDS_DATA_TO*1..${hops}]-(b:Application)
       WHERE a.tenantId = $tenantId AND b.tenantId = $tenantId
       RETURN nodes(path) AS nodes, relationships(path) AS edges`,
      { appId, tenantId }
    );
    return this.formatGraphResult(result);
  }

  async getImpactAnalysis(tenantId: string, appId: string) {
    // Find all downstream applications that depend on this app
    const result = await this.neo4jService.read(
      `MATCH path = (a:Application {id: $appId})-[:SENDS_DATA_TO*1..5]->(downstream:Application)
       WHERE a.tenantId = $tenantId
       RETURN nodes(path) AS nodes, relationships(path) AS edges`,
      { appId, tenantId }
    );
    return this.formatGraphResult(result);
  }

  async detectCircularDependencies(tenantId: string) {
    const result = await this.neo4jService.read(
      `MATCH path = (a:Application)-[:SENDS_DATA_TO*1..5]->(a)
       WHERE a.tenantId = $tenantId
       RETURN nodes(path) AS nodes, relationships(path) AS edges`,
      { tenantId }
    );
    return this.formatGraphResult(result);
  }

  async exportGraph(tenantId: string) {
    const result = await this.neo4jService.read(
      `MATCH (n {tenantId: $tenantId})
       OPTIONAL MATCH (n)-[r]->(m {tenantId: $tenantId})
       RETURN n AS nodes, r AS edges`,
      { tenantId }
    );
    return this.formatGraphResult(result);
  }

  private formatGraphResult(result: any) {
    const nodesMap = new Map();
    const edgesMap = new Map();

    for (const record of result.records) {
      const nodes = record.get('nodes');
      const edges = record.get('edges');
      
      if (Array.isArray(nodes)) {
        nodes.forEach((n: any) => nodesMap.set(n.identity.toString(), n.properties));
      } else if (nodes) {
        nodesMap.set(nodes.identity.toString(), nodes.properties);
      }

      if (Array.isArray(edges)) {
        edges.forEach((e: any) => {
           if (e) edgesMap.set(e.identity.toString(), {
             id: e.properties.id || e.identity.toString(),
             source: e.start.toString(),
             target: e.end.toString(),
             type: e.type,
             ...e.properties
           });
        });
      } else if (edges) {
        edgesMap.set(edges.identity.toString(), {
          id: edges.properties.id || edges.identity.toString(),
          source: edges.start.toString(),
          target: edges.end.toString(),
          type: edges.type,
          ...edges.properties
        });
      }
    }

    return {
      nodes: Array.from(nodesMap.values()).map(n => ({ id: n.id, data: n })),
      edges: Array.from(edgesMap.values())
    };
  }
}
