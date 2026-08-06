import { z } from 'zod';

export const envSchema = z.object({
  // Core
  NODE_ENV: z
    .enum(['development', 'staging', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z
    .string()
    .url()
    .default(
      'postgresql://postgres:postgres@localhost:5432/basemap?schema=public',
    ),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().optional(),

  // Elasticsearch
  ELASTICSEARCH_NODE: z.string().default('http://localhost:9200'),

  // Neo4j
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('basemap123'),

  // Auth
  JWT_SECRET: z.string().default('secretKey'),
  JWT_REFRESH_SECRET: z.string().default('refreshSecret'),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('basemap-assets'),

  // App
  APP_URL: z.string().url().optional(),

  // Billing (optional, graceful degradation)
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
}) satisfies z.ZodType<Record<string, unknown>>;

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: Record<string, unknown> = process.env): Env {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}