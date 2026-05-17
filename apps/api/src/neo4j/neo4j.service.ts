import { Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver, Session, ManagedTransaction } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnApplicationShutdown {
  private readonly driver: Driver;
  private readonly logger = new Logger(Neo4jService.name);

  constructor(private readonly configService: ConfigService) {
    const uri = this.configService.get<string>('NEO4J_URI') || 'bolt://localhost:7687';
    const username = this.configService.get<string>('NEO4J_USER') || 'neo4j';
    const password = this.configService.get<string>('NEO4J_PASSWORD') || 'basemap123';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    this.logger.log(`Neo4j Service connected to ${uri}`);
  }

  getReadSession(database?: string): Session {
    return this.driver.session({
      database: database || this.configService.get<string>('NEO4J_DATABASE') || 'neo4j',
      defaultAccessMode: neo4j.session.READ,
    });
  }

  getWriteSession(database?: string): Session {
    return this.driver.session({
      database: database || this.configService.get<string>('NEO4J_DATABASE') || 'neo4j',
      defaultAccessMode: neo4j.session.WRITE,
    });
  }

  async read(cypher: string, params?: Record<string, any>, database?: string) {
    const session = this.getReadSession(database);
    try {
      const res = await session.executeRead((tx: ManagedTransaction) => tx.run(cypher, params));
      return res;
    } finally {
      await session.close();
    }
  }

  async write(cypher: string, params?: Record<string, any>, database?: string) {
    const session = this.getWriteSession(database);
    try {
      const res = await session.executeWrite((tx: ManagedTransaction) => tx.run(cypher, params));
      return res;
    } finally {
      await session.close();
    }
  }

  onApplicationShutdown() {
    return this.driver.close();
  }
}
