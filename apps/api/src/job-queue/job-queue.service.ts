import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private queue: Queue;
  private worker: Worker;
  private connection: Redis;

  constructor(private configService: ConfigService) {
    const redisHost = this.configService.get('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get('REDIS_PORT', 6379);
    this.connection = new Redis({
      host: redisHost,
      port: Number(redisPort),
      maxRetriesPerRequest: null,
    });
  }

  async onModuleInit() {
    this.queue = new Queue('import-export', {
      connection: this.connection,
    });

    this.worker = new Worker(
      'import-export',
      async (job: Job) => {
        const { type, jobId, tenantId, userId } = job.data;
        
        if (type === 'import') {
          return { status: 'import-processed', jobId };
        }
        
        if (type === 'export') {
          return { status: 'export-processed', jobId };
        }
        
        throw new Error(`Unknown job type: ${type}`);
      },
      { connection: this.connection },
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.worker.close();
    await this.connection.quit();
  }

  async addImportJob(data: {
    jobId: string;
    tenantId: string;
    userId: string;
  }) {
    return this.queue.add('import', data, {
      jobId: `import-${data.jobId}`,
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 604800 },
    });
  }

  async addExportJob(data: {
    jobId: string;
    tenantId: string;
    userId: string;
  }) {
    return this.queue.add('export', data, {
      jobId: `export-${data.jobId}`,
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 604800 },
    });
  }

  async addScheduledExportJob(data: {
    jobId: string;
    tenantId: string;
    userId: string;
    scheduledAt: Date;
  }) {
    return this.queue.add('export', data, {
      jobId: `export-${data.jobId}`,
      delay: data.scheduledAt.getTime() - Date.now(),
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 604800 },
    });
  }

  getQueue() {
    return this.queue;
  }
}
