import {
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodeStream from 'stream';
import { promisify } from 'util';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const pipeline = promisify(nodeStream.pipeline);

export interface UploadOptions {
  contentType?: string;
  acl?: 'private' | 'public-read';
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly provider: 'local' | 's3';
  private readonly localRoot: string;
  private s3: S3Client | null = null;
  private readonly bucket: string;

  constructor() {
    this.provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase() as
      | 'local'
      | 's3';
    this.localRoot = path.resolve(process.env.LOCAL_STORAGE_DIR || './storage');
    this.bucket = process.env.S3_BUCKET || 'basemap-assets';
  }

  async onModuleInit() {
    if (this.provider === 's3') {
      this.s3 = new S3Client({
        endpoint: process.env.S3_ENDPOINT || undefined,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || '',
          secretAccessKey: process.env.S3_SECRET_KEY || '',
        },
        forcePathStyle: true,
      });
      await this.ensureBucket();
    } else {
      fs.mkdirSync(this.localRoot, { recursive: true });
    }
  }

  isS3(): boolean {
    return this.provider === 's3';
  }

  private async ensureBucket() {
    if (!this.s3) return;
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err: any) {
      if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3.send(
            new CreateBucketCommand({ Bucket: this.bucket }),
          );
          this.logger.log(`Created storage bucket '${this.bucket}'`);
        } catch (createErr: any) {
          if (createErr?.name !== 'BucketAlreadyOwnedByYou') {
            this.logger.warn(
              `Could not create bucket (will attempt on write): ${createErr?.message}`,
            );
          }
        }
      } else {
        this.logger.warn(`Storage endpoint connection warning: ${err?.message}`);
      }
    }
  }

  private localPath(key: string): string {
    return path.join(this.localRoot, key);
  }

  async put(key: string, data: Buffer | nodeStream.Readable | string, options?: UploadOptions) {
    if (this.provider === 's3' && this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: data as any,
          ContentType: options?.contentType,
        }),
      );
      return { key, url: await this.getUrl(key) };
    }

    const target = this.localPath(key);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (Buffer.isBuffer(data) || typeof data === 'string') {
      fs.writeFileSync(target, data as any);
    } else {
      const ws = fs.createWriteStream(target);
      await pipeline(data as nodeStream.Readable, ws);
    }
    return { key, url: target };
  }

  async read(key: string): Promise<nodeStream.Readable> {
    if (this.provider === 's3' && this.s3) {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return res.Body as nodeStream.Readable;
    }
    return fs.createReadStream(this.localPath(key));
  }

  async getBuffer(key: string): Promise<Buffer> {
    const stream = await this.read(key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<boolean> {
    if (this.provider === 's3' && this.s3) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    }
    try {
      fs.unlinkSync(this.localPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
    if (this.provider === 's3' && this.s3) {
      return getSignedUrl(
        this.s3,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn },
      );
    }
    const target = this.localPath(key);
    return fs.existsSync(target) ? target : null;
  }

  async getUrl(key: string): Promise<string> {
    if (this.provider === 's3' && this.s3) {
      return `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || ''}/${this.bucket}/${key}`;
    }
    return this.localPath(key);
  }

  async list(prefix: string): Promise<{ key: string; size?: number }[]> {
    if (this.provider === 's3' && this.s3) {
      const res = await this.s3.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
      );
      return (res.Contents || []).map((c) => ({ key: c.Key!, size: c.Size }));
    }
    const dir = this.localPath(prefix);
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).map((name) => ({
      key: path.join(prefix, name),
      size: fs.statSync(path.join(dir, name)).size,
    }));
  }

  async exists(key: string): Promise<boolean> {
    if (this.provider === 's3' && this.s3) {
      try {
        await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
        const res = await this.s3.send(
          new ListObjectsV2Command({ Bucket: this.bucket, Prefix: key, MaxKeys: 1 }),
        );
        return (res.Contents || []).some((c) => c.Key === key);
      } catch {
        return false;
      }
    }
    return fs.existsSync(this.localPath(key));
  }
}