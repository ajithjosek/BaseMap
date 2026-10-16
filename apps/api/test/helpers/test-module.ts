import { Test, TestingModule } from '@nestjs/testing';
import { createPrismaMock, PrismaMock } from '../__mocks__/prisma.mock';

/**
 * Creates a pre-configured NestJS Test module with Prisma mocked.
 * Override or add providers as needed per test.
 */
export async function createTestModule(
  providers: any[],
  options?: {
    additionalProviders?: any[];
    imports?: any[];
  },
) {
  const prismaMock = createPrismaMock();

  const module: TestingModule = await Test.createTestingModule({
    imports: options?.imports ?? [],
    providers: [
      ...providers,
      { provide: 'PrismaService', useValue: prismaMock },
      ...(options?.additionalProviders ?? []),
    ],
  }).compile();

  return { module, prismaMock };
}
